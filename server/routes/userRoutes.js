const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateProfile,
  getUserById,
  getAllUsers,
  exportUsersCsv,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);

router.get('/export/csv', protect, authorize('admin'), exportUsersCsv);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;