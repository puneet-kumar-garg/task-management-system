const pool = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [unread] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ notifications: rows, unread: parseInt(unread[0].count) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const notifyTaskAssigned = async (io, assigneeId, taskTitle, taskId, actorName) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [assigneeId, 'task_assigned', 'New task assigned', `${actorName} assigned you: "${taskTitle}"`, 'task', taskId]
    );
    io?.notifyUser(assigneeId, 'notification', { type: 'task_assigned', message: `${actorName} assigned you: "${taskTitle}"` });
  } catch {}
};

const checkDeadlines = async (io) => {
  try {
    const [tasks] = await pool.query(
      `SELECT id, title, assignee_id FROM tasks
       WHERE status != 'completed'
         AND deadline = CURRENT_DATE + INTERVAL '1 day'
         AND assignee_id IS NOT NULL`
    );
    for (const task of tasks) {
      const [existing] = await pool.query(
        `SELECT id FROM notifications WHERE user_id = $1 AND entity_id = $2
         AND type = 'deadline_approaching' AND DATE(created_at) = CURRENT_DATE`,
        [task.assignee_id, task.id]
      );
      if (existing.length) continue;
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [task.assignee_id, 'deadline_approaching', 'Deadline tomorrow', `Task "${task.title}" is due tomorrow`, 'task', task.id]
      );
      io?.notifyUser(task.assignee_id, 'notification', { type: 'deadline_approaching', message: `Task "${task.title}" is due tomorrow` });
    }
  } catch {}
};

module.exports = { getNotifications, markAllRead, markRead, notifyTaskAssigned, checkDeadlines };
