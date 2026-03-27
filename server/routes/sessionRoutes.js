const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/', sessionController.createSession);
router.get('/', sessionController.getAllSessions);
router.get('/my-enrollments', sessionController.getMyEnrollments);
router.get('/:id', sessionController.getSessionById);
router.put('/:id/status', sessionController.updateSessionStatus);
router.post('/:id/enroll', sessionController.enrollSession);
router.get('/:id/participants', sessionController.getSessionParticipants);
router.post('/:id/feedback', sessionController.submitFeedback);
router.get('/:id/feedback', sessionController.getSessionFeedback);
router.post('/:id/remind', sessionController.sendReminders);

module.exports = router;
