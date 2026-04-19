const pool = require('../config/db');

const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, avatar FROM users
       WHERE (email ILIKE $1 OR name ILIKE $2) AND id != $3 LIMIT 10`,
      [`%${q}%`, `%${q}%`, req.user.id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = $1, avatar = $2 WHERE id = $3',
      [name, avatar || null, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { searchUsers, getProfile, updateProfile };
