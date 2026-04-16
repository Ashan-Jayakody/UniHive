const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  createHelpRequest,
  inviteExperts,
  acceptHelpRequest,
  addMessage,
  getOpenRequests,
  getMyInvitations,
  getMyTasks,
  getMessages,
  getMyRequests,
  getSingleRequest,
  resolveHelpRequest,
  deleteHelpRequest
} = require('../controllers/helpRequestController');
const { protect } = require('../middleware/authMiddleware');


router.get('/invitations', protect, getMyInvitations);
router.get('/myrequests',  protect, getMyRequests);
router.get('/my-tasks',    protect, getMyTasks);


router.get('/',  protect, getOpenRequests);
router.post('/', protect, upload.single('attachment'), createHelpRequest);


router.get('/:id/messages', protect, getMessages);      
router.get('/:id',          protect, getSingleRequest); 

router.put('/:id/invite',   protect, inviteExperts);
router.put('/:id/accept',   protect, acceptHelpRequest);
router.put('/:id/resolve',  protect, resolveHelpRequest);
router.post('/:id/message', protect, addMessage);
router.delete('/:id',       protect, deleteHelpRequest);

module.exports = router;