// server/routes/resourceRoutes.js
const express = require('express');
const { getResourceAnalytics } = require('../controllers/resourceAnalyticsController');
const router = express.Router();
const uploadResourceFile = (req, res, next) => {
  upload.single('resourceFile')(req, res, (err) => {
    if (!err) return next();

    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Max size is 25MB.',
          data: null,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
        data: null,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed',
      data: null,
    });
  });
};
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createResource,
  updateOwnResource,
  deleteOwnResource,
  getOwnResources,
  getApprovedResources,
  getPendingResources,
  approveResource,
  rejectResource,
} = require('../controllers/resourceController');

// All routes protected
router.use(protect);

// student routes
router.post('/', authorize('student'), uploadResourceFile, createResource);
router.get('/analytics', authorize('faculty', 'admin'), getResourceAnalytics);
router.get('/mine', authorize('student'), getOwnResources);
router.put('/:id', authorize('student'), updateOwnResource);
router.delete('/:id', authorize('student'), deleteOwnResource);

// moderation routes
router.get('/pending', authorize('faculty', 'admin'), getPendingResources);
router.put('/:id/approve', authorize('faculty', 'admin'), approveResource);
router.put('/:id/reject', authorize('faculty', 'admin'), rejectResource);

// browse route (all authenticated users)
router.get('/', getApprovedResources);

module.exports = router;