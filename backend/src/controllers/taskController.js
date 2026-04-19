const { body } = require('express-validator');
const pool = require('../config/db');
const validate = require('../middleware/validate');
const { notifyTaskAssigned } = require('./notificationController');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed']),
  body('deadline').optional({ nullable: true }).isDate().withMessage('Invalid date'),
];

const getTasks = async (req, res) => {
  const { status, priority, search, team_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT t.*,
        u1.name AS creator_name, u1.email AS creator_email, u1.avatar AS creator_avatar,
        u2.name AS assignee_name, u2.email AS assignee_email, u2.avatar AS assignee_avatar,
        tm.name AS team_name
      FROM tasks t
      LEFT JOIN users u1 ON t.creator_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE (t.creator_id = ? OR t.assignee_id = ?
        OR t.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?))
    `;
    const params = [req.user.id, req.user.id, req.user.id];

    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
    if (team_id) { query += ' AND t.team_id = ?'; params.push(team_id); }
    if (search) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY FIELD(t.priority,"high","medium","low"), t.deadline ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [tasks] = await pool.query(query, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTask = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u1.name AS creator_name, u1.avatar AS creator_avatar,
              u2.name AS assignee_name, u2.avatar AS assignee_avatar, tm.name AS team_name
       FROM tasks t
       LEFT JOIN users u1 ON t.creator_id = u1.id
       LEFT JOIN users u2 ON t.assignee_id = u2.id
       LEFT JOIN teams tm ON t.team_id = tm.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTask = [
  taskValidation, validate,
  async (req, res) => {
    const { title, description, deadline, priority, assignee_id, team_id, status } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO tasks (title, description, deadline, priority, status, creator_id, assignee_id, team_id) VALUES (?,?,?,?,?,?,?,?)',
        [title, description || null, deadline || null, priority || 'medium', status || 'pending', req.user.id, assignee_id || null, team_id || null]
      );
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?,?,?,?)',
        [req.user.id, `Created task: ${title}`, 'task', result.insertId]
      );
      // Notify assignee
      if (assignee_id && assignee_id !== req.user.id) {
        await notifyTaskAssigned(req.io, assignee_id, title, result.insertId, req.user.name);
      }
      // Notify team
      if (team_id) req.io?.notifyTeam(team_id, 'task_update', { action: 'created', taskId: result.insertId });

      const [task] = await pool.query(
        `SELECT t.*, u1.name AS creator_name, u2.name AS assignee_name, u2.avatar AS assignee_avatar, tm.name AS team_name
         FROM tasks t LEFT JOIN users u1 ON t.creator_id=u1.id LEFT JOIN users u2 ON t.assignee_id=u2.id LEFT JOIN teams tm ON t.team_id=tm.id
         WHERE t.id = ?`, [result.insertId]
      );
      res.status(201).json(task[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const updateTask = [
  taskValidation, validate,
  async (req, res) => {
    const { title, description, deadline, priority, status, assignee_id, team_id } = req.body;
    try {
      const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
      if (!existing.length) return res.status(404).json({ message: 'Task not found' });
      if (existing[0].creator_id !== req.user.id && req.user.role === 'member')
        return res.status(403).json({ message: 'Not authorized' });

      await pool.query(
        'UPDATE tasks SET title=?, description=?, deadline=?, priority=?, status=?, assignee_id=?, team_id=? WHERE id=?',
        [title, description || null, deadline || null, priority, status, assignee_id || null, team_id || null, req.params.id]
      );
      await pool.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?,?,?,?)',
        [req.user.id, `Updated task: ${title}`, 'task', req.params.id]
      );
      // Notify new assignee
      if (assignee_id && assignee_id !== existing[0].assignee_id && assignee_id !== req.user.id) {
        await notifyTaskAssigned(req.io, assignee_id, title, req.params.id, req.user.name);
      }
      if (team_id) req.io?.notifyTeam(team_id, 'task_update', { action: 'updated', taskId: req.params.id });

      const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'in_progress', 'completed'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?,?,?,?)',
      [req.user.id, `Changed task status to: ${status}`, 'task', req.params.id]
    );
    const [task] = await pool.query('SELECT team_id FROM tasks WHERE id = ?', [req.params.id]);
    if (task[0]?.team_id) req.io?.notifyTeam(task[0].team_id, 'task_update', { action: 'status_changed', taskId: req.params.id, status });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT creator_id FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Task not found' });
    if (existing[0].creator_id !== req.user.id && req.user.role === 'member')
      return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'completed') AS completed,
        SUM(status = 'pending') AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(deadline < CURDATE() AND status != 'completed') AS overdue
       FROM tasks WHERE creator_id = ? OR assignee_id = ?`,
      [req.user.id, req.user.id]
    );
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, updateStatus, deleteTask, getStats };
