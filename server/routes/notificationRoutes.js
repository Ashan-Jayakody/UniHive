const express = require('express');
const router = express.Router();

const {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.post('/', protect, authorize('admin'), createNotification);
router.put('/read-all', protect, markAllNotificationsAsRead);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;