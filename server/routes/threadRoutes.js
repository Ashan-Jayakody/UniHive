const express = require('express');
const router = express.Router();

const {
  getAllThreads,
  getMyThreads,
  getMyRepliedThreads,
  getMySavedThreads,
  saveThread,
  unsaveThread,
  createThread,
  updateThread,
  deleteThread,
  addReply,
  updateReply,
  deleteReply,
} = require('../controllers/threadController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllThreads);
router.get('/mine', protect, getMyThreads);
router.get('/replied', protect, getMyRepliedThreads);
router.get('/saved', protect, getMySavedThreads);

router.post('/', protect, createThread);
router.post('/:id/save', protect, saveThread);
router.delete('/:id/save', protect, unsaveThread);

router.put('/:id', protect, updateThread);
router.delete('/:id', protect, deleteThread);

router.post('/:id/replies', protect, addReply);
router.put('/:id/replies/:replyId', protect, updateReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

module.exports = router;