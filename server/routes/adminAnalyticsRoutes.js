const express = require('express');
const router = express.Router();

const { getAdminAnalytics } = require('../controllers/adminAnalyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin'), getAdminAnalytics);

module.exports = router;