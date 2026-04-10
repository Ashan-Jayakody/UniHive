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

// Public
router.get('/', getAllThreads);

// Protected thread activity
router.get('/mine', protect, getMyThreads);
router.get('/replied', protect, getMyRepliedThreads);
router.get('/saved', protect, getMySavedThreads);

// Create thread
router.post('/', protect, createThread);

// Save / unsave thread
router.post('/:id/save', protect, saveThread);
router.delete('/:id/save', protect, unsaveThread);

// Update / delete thread
router.put('/:id', protect, updateThread);
router.delete('/:id', protect, deleteThread);

// Replies
router.post('/:id/replies', protect, addReply);
router.put('/:id/replies/:replyId', protect, updateReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

module.exports = router;