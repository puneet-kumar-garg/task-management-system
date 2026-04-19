const pool = require('../config/db');

const getComments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
       FROM task_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.taskId]
    );
    const map = {};
    const roots = [];
    rows.forEach((r) => { map[r.id] = { ...r, replies: [] }; });
    rows.forEach((r) => {
      if (r.parent_id) map[r.parent_id]?.replies.push(map[r.id]);
      else roots.push(map[r.id]);
    });
    res.json(roots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  const { content, parent_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, parent_id, content) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.params.taskId, req.user.id, parent_id || null, content]
    );

    const mentions = [...content.matchAll(/@(\w+)/g)].map((m) => m[1]);
    if (mentions.length) {
      const placeholders = mentions.map((_, i) => `$${i + 1}`).join(',');
      const [users] = await pool.query(
        `SELECT id, name FROM users WHERE name IN (${placeholders})`, mentions
      );
      for (const u of users) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5,$6)',
          [u.id, 'comment_mention', 'You were mentioned', `${req.user.name} mentioned you in a comment`, 'task', req.params.taskId]
        );
        req.io?.notifyUser(u.id, 'notification', { type: 'comment_mention', message: `${req.user.name} mentioned you` });
      }
    }

    req.io?.to(`task:${req.params.taskId}`).emit('new_comment', { taskId: req.params.taskId });

    const [comment] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
       FROM task_comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [result[0].id]
    );
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM task_comments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM task_comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getComments, addComment, deleteComment };
