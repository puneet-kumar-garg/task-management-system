const pool = require('../config/db');

const getActivity = async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT al.*, u.name AS user_name FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.user_id = $1 ORDER BY al.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getActivity };
