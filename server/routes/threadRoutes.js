const express = require('express');
const router = express.Router();
const {
  getThreads,
  createThread,
  addReply,
} = require('../controllers/threadController');

router.get('/', getThreads);
router.post('/', createThread);
router.post('/:id/replies', addReply);

module.exports = router;