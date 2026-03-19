const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const {createHelpRequest, 
        inviteExperts, 
        acceptHelpRequest, 
        addMessage,
        getOpenRequests,
        getMyInvitations,
        resolveHelpRequest} = require('../controllers/helpRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, upload.single('attachment'), createHelpRequest);
router.put('/:id/invite', protect, inviteExperts);
router.put('/:id/accept', protect, acceptHelpRequest);
router.post('/:id/message', protect, addMessage);
router.put('/:id/resolve', protect, resolveHelpRequest);
router.get('/invitations', protect, getMyInvitations);
router.get('/', protect, getOpenRequests);
module.exports = router;