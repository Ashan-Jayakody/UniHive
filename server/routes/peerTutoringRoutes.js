const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createPeerTutoringSession,
  getPeerTutoringSessions,
  getMyPeerTutoringSessions,
  getPendingPeerTutoringSessions,
  getAllPeerTutoringSessions,
  approvePeerTutoringSession,
  rejectPeerTutoringSession,
  updatePeerTutoringSession,
  deletePeerTutoringSession,
  joinPeerTutoringSession,
} = require('../controllers/peerTutoringController');

router.get('/', protect, getPeerTutoringSessions);
router.get('/mine', protect, getMyPeerTutoringSessions);
router.get('/pending', protect, authorize('admin'), getPendingPeerTutoringSessions);
router.get('/all', protect, authorize('admin'), getAllPeerTutoringSessions);
router.post('/', protect, createPeerTutoringSession);
router.put('/:id', protect, updatePeerTutoringSession);
router.post('/:id/join', protect, joinPeerTutoringSession);
router.delete('/:id', protect, deletePeerTutoringSession);
router.put('/:id/approve', protect, authorize('admin'), approvePeerTutoringSession);
router.put('/:id/reject', protect, authorize('admin'), rejectPeerTutoringSession);

module.exports = router;
