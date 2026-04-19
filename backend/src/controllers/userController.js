const pool = require('../config/db');

// GET /api/users/search?q=email
const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE (email LIKE ? OR name LIKE ?) AND id != ? LIMIT 10',
      [`%${q}%`, `%${q}%`, req.user.id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name, avatar || null, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { searchUsers, getProfile, updateProfile };
