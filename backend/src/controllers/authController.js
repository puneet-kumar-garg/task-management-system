const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/db');
const validate = require('../middleware/validate');

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const signup = [
  signupValidation, validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.length) return res.status(409).json({ message: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
        [name, email, hashed]
      );
      const user = result[0];
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

const login = [
  loginValidation, validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });

      const { password: _, ...safeUser } = user;
      res.json({ token: signToken(safeUser), user: safeUser });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, me };
