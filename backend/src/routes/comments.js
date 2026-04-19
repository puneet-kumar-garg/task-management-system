const router = require('express').Router();
const auth = require('../middleware/auth');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');

router.use(auth);
router.get('/:taskId', getComments);
router.post('/:taskId', addComment);
router.delete('/:id', deleteComment);

module.exports = router;
