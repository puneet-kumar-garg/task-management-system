const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { getTeams, getTeam, createTeam, addMember, removeMember, deleteTeam } = require('../controllers/teamController');

router.use(authenticate);
router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', createTeam);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.delete('/:id', deleteTeam);

module.exports = router;
