const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { searchUsers, getProfile, updateProfile } = require('../controllers/userController');

router.use(authenticate);
router.get('/search', searchUsers);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
