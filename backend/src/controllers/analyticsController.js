const pool = require('../config/db');

const getTrends = async (req, res) => {
  const { period = 'weekly' } = req.query;
  const days = period === 'monthly' ? 30 : 7;
  try {
    const [rows] = await pool.query(
      `SELECT
        DATE(updated_at) AS date,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
        COUNT(*) AS total
       FROM tasks
       WHERE (creator_id = $1 OR assignee_id = $2)
         AND updated_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(updated_at)
       ORDER BY date ASC`,
      [req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProductivity = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN deadline < CURRENT_DATE AND status != 'completed' THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN status='completed' AND (deadline IS NULL OR deadline >= DATE(updated_at)) THEN 1 ELSE 0 END) AS on_time
       FROM tasks
       WHERE (creator_id = $1 OR assignee_id = $2)
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user.id, req.user.id]
    );
    const s = stats[0];
    const total = parseInt(s.total) || 1;
    const completed = parseInt(s.completed) || 0;
    const on_time = parseInt(s.on_time) || 0;
    const completionRate = (completed / total) * 60;
    const onTimeRate = completed > 0 ? (on_time / completed) * 40 : 0;
    const score = Math.round(completionRate + onTimeRate);
    res.json({ score, ...s });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTeamPerformance = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.id, u.name, u.avatar,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status='completed'   THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN tasks t ON t.assignee_id = u.id AND t.team_id = $1
       WHERE tm.team_id = $2
       GROUP BY u.id, u.name, u.avatar`,
      [req.params.teamId, req.params.teamId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBurndown = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT DATE(created_at) AS created_date, DATE(updated_at) AS completed_date, status
       FROM tasks
       WHERE team_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '14 days'`,
      [req.params.teamId]
    );

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const remaining = tasks.filter(
        (t) => t.created_date <= dateStr &&
          (t.status !== 'completed' || t.completed_date > dateStr)
      ).length;
      days.push({ date: dateStr, remaining });
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTrends, getProductivity, getTeamPerformance, getBurndown };
