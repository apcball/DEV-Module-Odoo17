const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'it_staff', 'manager'));

router.get('/dashboard', reportController.getDashboard);
router.get('/trends', reportController.getTrends);

module.exports = router;
