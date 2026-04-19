const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, updateStatus, deleteTask, getStats } = require('../controllers/taskController');

router.use(authenticate);
router.get('/stats', getStats);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTask);

module.exports = router;
