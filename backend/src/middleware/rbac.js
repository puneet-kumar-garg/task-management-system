const ROLE_HIERARCHY = { admin: 3, manager: 2, member: 1 };

// Require a minimum role level
const requireRole = (...roles) => (req, res, next) => {
  const userLevel = ROLE_HIERARCHY[req.user?.role] || 0;
  const required = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] || 0));
  if (userLevel >= required) return next();
  res.status(403).json({ message: 'Insufficient permissions' });
};

// Require team-level role (owner or manager within a team)
const requireTeamRole = (...roles) => async (req, res, next) => {
  const pool = require('../config/db');
  const teamId = req.params.id || req.body.team_id;
  if (!teamId) return next();
  try {
    const [rows] = await pool.query(
      'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ message: 'Not a team member' });
    if (roles.includes(rows[0].role) || req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Insufficient team permissions' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requireRole, requireTeamRole };
