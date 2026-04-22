const express = require('express');
const router = express.Router();
const {
  createSession,
  getApprovedSessions,
  getMySessions,
  getAllSessions,
  updateSession,
  deleteSession,
  approveSession,
  rejectSession,
  joinSession,
  submitFeedback,
  notifyAttendance,
} = require('../controllers/peerTutoringController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base path: /api/peer-tutoring

router.route('/')
  .post(protect, createSession)
  .get(protect, getApprovedSessions);

router.get('/mine', protect, getMySessions);
router.get('/all',  protect, authorize('admin', 'faculty'), getAllSessions);

router.route('/:id')
  .put(protect, updateSession)
  .delete(protect, deleteSession);

router.put('/:id/approve', protect, authorize('admin'), approveSession);
router.put('/:id/reject',  protect, authorize('admin'), rejectSession);

router.post('/:id/join',     protect, joinSession);
router.post('/:id/feedback', protect, submitFeedback);
router.post('/:id/notify-attendance', protect, notifyAttendance);

module.exports = router;
