const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getMyProfile,
    updateProfile,
    getUserById,
    getAllUsers,
    deleteUser
} = require('../controllers/userController');

// Logged-in users
router.get('/:id',protect, getUserById);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);



// Admin only
router.get('/', protect, authorize('admin'), getAllUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;