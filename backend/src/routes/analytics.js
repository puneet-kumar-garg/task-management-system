const router = require('express').Router();
const auth = require('../middleware/auth');
const { getTrends, getProductivity, getTeamPerformance, getBurndown } = require('../controllers/analyticsController');

router.use(auth);
router.get('/trends', getTrends);
router.get('/productivity', getProductivity);
router.get('/team/:teamId', getTeamPerformance);
router.get('/burndown/:teamId', getBurndown);

module.exports = router;
