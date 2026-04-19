const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    try {
      const [result] = await pool.query(
        `INSERT INTO task_attachments (task_id, user_id, filename, original_name, mimetype, size, url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [req.params.taskId, req.user.id, req.file.filename, req.file.originalname,
         req.file.mimetype, req.file.size, url]
      );
      res.status(201).json({ id: result[0].id, url, original_name: req.file.originalname, mimetype: req.file.mimetype });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

const getAttachments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS uploader_name FROM task_attachments a
       JOIN users u ON a.user_id = u.id WHERE a.task_id = $1 ORDER BY a.created_at DESC`,
      [req.params.taskId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAttachment = async (req, res) => {
  const fs = require('fs');
  try {
    const [rows] = await pool.query('SELECT * FROM task_attachments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    const filePath = path.join(__dirname, '../../../uploads', rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM task_attachments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadFile, getAttachments, deleteAttachment };
