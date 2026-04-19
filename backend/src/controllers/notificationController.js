const pool = require('../config/db');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [unread] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ notifications: rows, unread: unread[0].count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called by task controller when a task is assigned
const notifyTaskAssigned = async (io, assigneeId, taskTitle, taskId, actorName) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
      [assigneeId, 'task_assigned', 'New task assigned', `${actorName} assigned you: "${taskTitle}"`, 'task', taskId]
    );
    io?.notifyUser(assigneeId, 'notification', { type: 'task_assigned', message: `${actorName} assigned you: "${taskTitle}"` });
  } catch {}
};

// Deadline check — call this on a cron or at login
const checkDeadlines = async (io) => {
  try {
    const [tasks] = await pool.query(
      `SELECT t.id, t.title, t.assignee_id, t.deadline
       FROM tasks t
       WHERE t.status != 'completed'
         AND t.deadline = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND t.assignee_id IS NOT NULL`
    );
    for (const task of tasks) {
      const [existing] = await pool.query(
        `SELECT id FROM notifications WHERE user_id = ? AND entity_id = ? AND type = 'deadline_approaching' AND DATE(created_at) = CURDATE()`,
        [task.assignee_id, task.id]
      );
      if (existing.length) continue;
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
        [task.assignee_id, 'deadline_approaching', 'Deadline tomorrow', `Task "${task.title}" is due tomorrow`, 'task', task.id]
      );
      io?.notifyUser(task.assignee_id, 'notification', { type: 'deadline_approaching', message: `Task "${task.title}" is due tomorrow` });
    }
  } catch {}
};

module.exports = { getNotifications, markAllRead, markRead, notifyTaskAssigned, checkDeadlines };
