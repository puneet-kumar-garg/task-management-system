const router = require('express').Router();
const auth = require('../middleware/auth');
const { uploadFile, getAttachments, deleteAttachment } = require('../controllers/uploadController');

router.use(auth);
router.post('/:taskId', uploadFile);
router.get('/:taskId', getAttachments);
router.delete('/:id', deleteAttachment);

module.exports = router;
