const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// existing / main working routes
router.get('/', authMiddleware.protect, userController.getAllUsers);
router.put('/:id', authMiddleware.protect, userController.updateUser);
router.delete('/:id', authMiddleware.protect, userController.deleteUser);

// extra missing features
router.put('/me/change-password', authMiddleware.protect, userController.changePassword);
router.put('/me/profile-photo', authMiddleware.protect, userController.updateProfilePhoto);
router.put('/me/deactivate', authMiddleware.protect, userController.deactivateMyAccount);

router.put('/:id/suspend', authMiddleware.protect, authMiddleware.authorize('admin'), userController.suspendUser);
router.put('/:id/ban', authMiddleware.protect, authMiddleware.authorize('admin'), userController.banUser);
router.get('/:id/login-history', authMiddleware.protect, authMiddleware.authorize('admin'), userController.getLoginHistory);
router.put('/:id/verify-email', authMiddleware.protect, authMiddleware.authorize('admin'), userController.verifyEmail);
router.put('/:id/verify-phone', authMiddleware.protect, authMiddleware.authorize('admin'), userController.verifyPhone);

module.exports = router;