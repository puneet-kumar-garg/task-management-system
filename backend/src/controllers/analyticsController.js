const pool = require('../config/db');

// GET /api/analytics/trends?period=weekly|monthly
const getTrends = async (req, res) => {
  const { period = 'weekly' } = req.query;
  const days = period === 'monthly' ? 30 : 7;
  try {
    const [rows] = await pool.query(
      `SELECT
        DATE(updated_at) AS date,
        SUM(status = 'completed') AS completed,
        COUNT(*) AS total
       FROM tasks
       WHERE (creator_id = ? OR assignee_id = ?)
         AND updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(updated_at)
       ORDER BY date ASC`,
      [req.user.id, req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/productivity
const getProductivity = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'completed') AS completed,
        SUM(deadline < CURDATE() AND status != 'completed') AS overdue,
        SUM(status = 'completed' AND (deadline IS NULL OR deadline >= DATE(updated_at))) AS on_time
       FROM tasks
       WHERE (creator_id = ? OR assignee_id = ?)
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [req.user.id, req.user.id]
    );
    const s = stats[0];
    const total = s.total || 1;
    // Score: 60% completion rate + 40% on-time rate
    const completionRate = (s.completed / total) * 60;
    const onTimeRate = s.completed > 0 ? ((s.on_time / s.completed) * 40) : 0;
    const score = Math.round(completionRate + onTimeRate);
    res.json({ score, ...s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/team/:teamId
const getTeamPerformance = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.id, u.name, u.avatar,
        COUNT(t.id) AS total_tasks,
        SUM(t.status = 'completed') AS completed,
        SUM(t.status = 'in_progress') AS in_progress,
        SUM(t.deadline < CURDATE() AND t.status != 'completed') AS overdue
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN tasks t ON t.assignee_id = u.id AND t.team_id = ?
       WHERE tm.team_id = ?
       GROUP BY u.id, u.name, u.avatar`,
      [req.params.teamId, req.params.teamId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/burndown/:teamId
const getBurndown = async (req, res) => {
  try {
    // Get tasks created in last 14 days for the team
    const [tasks] = await pool.query(
      `SELECT DATE(created_at) AS created_date, DATE(updated_at) AS completed_date, status
       FROM tasks
       WHERE team_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)`,
      [req.params.teamId]
    );

    // Build day-by-day remaining work
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const remaining = tasks.filter(
        (t) => t.created_date <= dateStr && (t.status !== 'completed' || t.completed_date > dateStr)
      ).length;
      days.push({ date: dateStr, remaining });
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTrends, getProductivity, getTeamPerformance, getBurndown };
