const { body } = require('express-validator');
const pool = require('../config/db');
const validate = require('../middleware/validate');

const getTeams = async (req, res) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
       FROM teams t
       JOIN users u ON t.owner_id = u.id
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1`,
      [req.user.id]
    );
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.*, u.name AS owner_name FROM teams t JOIN users u ON t.owner_id = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!teams.length) return res.status(404).json({ message: 'Team not found' });

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, tm.role, tm.joined_at
       FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1`,
      [req.params.id]
    );
    res.json({ ...teams[0], members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTeam = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  validate,
  async (req, res) => {
    const { name, description } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO teams (name, description, owner_id) VALUES ($1,$2,$3) RETURNING id',
        [name, description || null, req.user.id]
      );
      const teamId = result[0].id;
      await pool.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1,$2,$3)',
        [teamId, req.user.id, 'owner']
      );
      const [team] = await pool.query('SELECT * FROM teams WHERE id = $1', [teamId]);
      res.status(201).json(team[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const addMember = async (req, res) => {
  const { email } = req.body;
  try {
    const [team] = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (!team.length) return res.status(403).json({ message: 'Only team owner can add members' });

    const [user] = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!user.length) return res.status(404).json({ message: 'User not found' });

    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES ($1,$2) ON CONFLICT (team_id, user_id) DO NOTHING',
      [req.params.id, user[0].id]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const [team] = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (!team.length) return res.status(403).json({ message: 'Only team owner can remove members' });
    if (parseInt(req.params.userId) === req.user.id)
      return res.status(400).json({ message: 'Owner cannot remove themselves' });

    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const [team] = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (!team.length) return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeams, getTeam, createTeam, addMember, removeMember, deleteTeam };
