const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const ALLOWED_CATEGORIES = ['Notes', 'Videos', 'Research Papers', 'Links'];
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'category', 'subject'];

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
    data: null,
  });

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const emitNotificationToUser = (userId, notification) => {
  try {
    getIO().to(`user:${userId}`).emit('notification:new', notification);
  } catch (error) {
    console.error('emitNotificationToUser error:', error.message);
  }
};

const sanitizeSortBy = (value) =>
  ALLOWED_SORT_FIELDS.includes(value) ? value : 'createdAt';

const sanitizeOrder = (value) => (String(value).toLowerCase() === 'asc' ? 1 : -1);

const buildUploadDateRange = (uploadDate) => {
  if (!uploadDate) return null;
  const start = new Date(`${uploadDate}T00:00:00.000Z`);
  const end = new Date(`${uploadDate}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { $gte: start, $lte: end };
};

const isVideoMimeType = (mimeType = '') =>
  String(mimeType).toLowerCase().startsWith('video/');

const isAllowedNotesMimeType = (mimeType = '') => {
  const value = String(mimeType).toLowerCase().trim();
  return value === 'image/png' || value === 'application/pdf';
};

const isLikelyNotesFileUrl = (url = '') => {
  const value = String(url).trim().toLowerCase();
  if (!value) return false;
  return /\.(png|pdf)(\?.*)?$/i.test(value);
};

const isLikelyVideoUrl = (url = '') => {
  const value = String(url).trim().toLowerCase();
  if (!value) return false;

  const directVideoExtPattern = /\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i;
  if (directVideoExtPattern.test(value)) return true;

  return /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(value);
};

// POST -> localhost:5000/api/resources
// student only
exports.createResource = async (req, res) => {
  try {
    const { title, description, category, subject, module, fileUrl, linkUrl, mimeType, size } = req.body;

    if (!title || !subject || !category) {
      return sendError(res, 400, 'title, category, and subject are required');
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return sendError(res, 400, 'Invalid category');
    }

    // support multipart uploads if req.file exists
    const resolvedFileUrl = req.file
      ? req.protocol + '://' + req.get('host') + '/uploads/resources/' + req.file.filename
      : (fileUrl || '').trim();
    const resolvedMimeType = req.file ? req.file.mimetype : (mimeType || '').trim();
    const resolvedSize = req.file ? req.file.size : Number(size || 0);
    const trimmedLinkUrl = (linkUrl || '').trim();

    if (!resolvedFileUrl && !trimmedLinkUrl) {
      return sendError(res, 400, 'Either fileUrl or linkUrl is required');
    }

    if (category === 'Videos') {
      if (req.file && !isVideoMimeType(resolvedMimeType)) {
        return sendError(res, 400, 'For Videos category, only video files are allowed');
      }

      if (trimmedLinkUrl && !isLikelyVideoUrl(trimmedLinkUrl)) {
        return sendError(res, 400, 'For Videos category, linkUrl must be a valid video link');
      }

      if (!req.file && resolvedFileUrl && resolvedMimeType && !isVideoMimeType(resolvedMimeType)) {
        return sendError(res, 400, 'For Videos category, file mimeType must be video/*');
      }

      if (!req.file && resolvedFileUrl && !resolvedMimeType && !isLikelyVideoUrl(resolvedFileUrl)) {
        return sendError(res, 400, 'For Videos category, fileUrl must be a valid video URL');
      }
    }

    if (category === 'Links') {
      if (req.file || resolvedFileUrl) {
        return sendError(res, 400, 'For Links category, only linkUrl is allowed. File uploads are not allowed');
      }

      if (!trimmedLinkUrl) {
        return sendError(res, 400, 'For Links category, linkUrl is required');
      }
    }

    if (category === 'Notes') {
      if (req.file && !isAllowedNotesMimeType(resolvedMimeType)) {
        return sendError(res, 400, 'For Notes category, only PNG and PDF files are allowed');
      }

      if (trimmedLinkUrl && !isLikelyNotesFileUrl(trimmedLinkUrl)) {
        return sendError(res, 400, 'For Notes category, linkUrl must point to a .png or .pdf file');
      }

      if (!req.file && resolvedFileUrl) {
        if (resolvedMimeType && !isAllowedNotesMimeType(resolvedMimeType)) {
          return sendError(res, 400, 'For Notes category, file mimeType must be image/png or application/pdf');
        }

        if (!resolvedMimeType && !isLikelyNotesFileUrl(resolvedFileUrl)) {
          return sendError(res, 400, 'For Notes category, fileUrl must point to a .png or .pdf file');
        }
      }
    }

    if (category === 'Research Papers') {
      if (req.file && isVideoMimeType(resolvedMimeType)) {
        return sendError(res, 400, 'For Research Papers category, video files are not allowed');
      }

      if (trimmedLinkUrl && isLikelyVideoUrl(trimmedLinkUrl)) {
        return sendError(res, 400, 'For Research Papers category, video links are not allowed');
      }

      if (!req.file && resolvedFileUrl) {
        if (resolvedMimeType && isVideoMimeType(resolvedMimeType)) {
          return sendError(res, 400, 'For Research Papers category, file mimeType cannot be video/*');
        }

        if (!resolvedMimeType && isLikelyVideoUrl(resolvedFileUrl)) {
          return sendError(res, 400, 'For Research Papers category, fileUrl cannot be a video link');
        }
      }
    }

    const resource = await Resource.create({
      title: title.trim(),
      description: (description || '').trim(),
      category,
      subject: subject.trim(),
      module: (module || '').trim(),
      uploader: req.user._id,
      fileUrl: resolvedFileUrl,
      linkUrl: trimmedLinkUrl,
      mimeType: resolvedMimeType,
      size: Number.isFinite(resolvedSize) ? resolvedSize : 0,
      approvalStatus: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Resource submitted for review',
      data: resource,
    });
  } catch (error) {
    return sendError(res, 500, `Failed to create resource: ${error.message}`);
  }
};

// PUT -> localhost:5000/api/resources/:id
// student owner only
exports.updateOwnResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) return sendError(res, 404, 'Resource not found');
    if (resource.uploader.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only edit your own resources');
    }
    if (resource.approvalStatus === 'approved') {
      return sendError(res, 400, 'Approved resources cannot be edited by student');
    }

    const allowedFields = ['title', 'description', 'category', 'subject', 'module', 'fileUrl', 'linkUrl', 'mimeType', 'size'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        resource[field] = req.body[field];
      }
    }

    if (resource.category && !ALLOWED_CATEGORIES.includes(resource.category)) {
      return sendError(res, 400, 'Invalid category');
    }

    if (!String(resource.title || '').trim() || !String(resource.subject || '').trim() || !String(resource.category || '').trim()) {
      return sendError(res, 400, 'title, category, and subject are required');
    }

    if (!String(resource.fileUrl || '').trim() && !String(resource.linkUrl || '').trim()) {
      return sendError(res, 400, 'Either fileUrl or linkUrl is required');
    }

    if (resource.category === 'Videos') {
      const currentMimeType = String(resource.mimeType || '').trim();
      const currentLinkUrl = String(resource.linkUrl || '').trim();
      const currentFileUrl = String(resource.fileUrl || '').trim();
      const hasFileUrl = Boolean(String(resource.fileUrl || '').trim());

      if (hasFileUrl && currentMimeType && !isVideoMimeType(currentMimeType)) {
        return sendError(res, 400, 'For Videos category, file mimeType must be video/*');
      }

      if (currentLinkUrl && !isLikelyVideoUrl(currentLinkUrl)) {
        return sendError(res, 400, 'For Videos category, linkUrl must be a valid video link');
      }

      if (hasFileUrl && !currentMimeType && !isLikelyVideoUrl(currentFileUrl)) {
        return sendError(res, 400, 'For Videos category, fileUrl must be a valid video URL');
      }
    }

    if (resource.category === 'Links') {
      const currentLinkUrl = String(resource.linkUrl || '').trim();
      const hasFileUrl = Boolean(String(resource.fileUrl || '').trim());

      if (hasFileUrl) {
        return sendError(res, 400, 'For Links category, only linkUrl is allowed. File uploads are not allowed');
      }

      if (!currentLinkUrl) {
        return sendError(res, 400, 'For Links category, linkUrl is required');
      }
    }

    if (resource.category === 'Notes') {
      const currentMimeType = String(resource.mimeType || '').trim();
      const currentLinkUrl = String(resource.linkUrl || '').trim();
      const currentFileUrl = String(resource.fileUrl || '').trim();

      if (currentMimeType && !isAllowedNotesMimeType(currentMimeType)) {
        return sendError(res, 400, 'For Notes category, file mimeType must be image/png or application/pdf');
      }

      if (currentLinkUrl && !isLikelyNotesFileUrl(currentLinkUrl)) {
        return sendError(res, 400, 'For Notes category, linkUrl must point to a .png or .pdf file');
      }

      if (currentFileUrl && !currentMimeType && !isLikelyNotesFileUrl(currentFileUrl)) {
        return sendError(res, 400, 'For Notes category, fileUrl must point to a .png or .pdf file');
      }
    }

    if (resource.category === 'Research Papers') {
      const currentMimeType = String(resource.mimeType || '').trim();
      const currentLinkUrl = String(resource.linkUrl || '').trim();
      const currentFileUrl = String(resource.fileUrl || '').trim();

      if (currentMimeType && isVideoMimeType(currentMimeType)) {
        return sendError(res, 400, 'For Research Papers category, file mimeType cannot be video/*');
      }

      if (currentLinkUrl && isLikelyVideoUrl(currentLinkUrl)) {
        return sendError(res, 400, 'For Research Papers category, video links are not allowed');
      }

      if (currentFileUrl && !currentMimeType && isLikelyVideoUrl(currentFileUrl)) {
        return sendError(res, 400, 'For Research Papers category, fileUrl cannot be a video link');
      }
    }

    // force re-review after edit
    resource.approvalStatus = 'pending';
    resource.reviewer = null;
    resource.reviewedAt = null;
    resource.rejectionReason = '';

    await resource.save();

    return res.status(200).json({
      success: true,
      message: 'Resource updated and resubmitted for review',
      data: resource,
    });
  } catch (error) {
    return sendError(res, 500, `Failed to update resource: ${error.message}`);
  }
};

// DELETE -> localhost:5000/api/resources/:id
// student owner only
exports.deleteOwnResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) return sendError(res, 404, 'Resource not found');
    if (resource.uploader.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only delete your own resources');
    }

    await resource.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Resource deleted',
      data: { _id: id },
    });
  } catch (error) {
    return sendError(res, 500, `Failed to delete resource: ${error.message}`);
  }
};

// GET -> localhost:5000/api/resources/mine
// student only
exports.getOwnResources = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const total = await Resource.countDocuments({ uploader: req.user._id });
    const resources = await Resource.find({ uploader: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Own resources fetched',
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, `Failed to fetch own resources: ${error.message}`);
  }
};

// GET -> localhost:5000/api/resources
// all authenticated users
exports.getApprovedResources = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const sortBy = sanitizeSortBy(req.query.sortBy);
    const order = sanitizeOrder(req.query.order);

    const filter = {};

    if (req.query.category) {
      if (!ALLOWED_CATEGORIES.includes(req.query.category)) {
        return sendError(res, 400, 'Invalid category filter');
      }
      filter.category = req.query.category;
    }

    if (req.query.subject) filter.subject = new RegExp(req.query.subject, 'i');
    if (req.query.module) filter.module = new RegExp(req.query.module, 'i');

    const dateRange = buildUploadDateRange(req.query.uploadDate);
    if (req.query.uploadDate && !dateRange) {
      return sendError(res, 400, 'Invalid uploadDate. Expected YYYY-MM-DD');
    }
    if (dateRange) filter.createdAt = dateRange;

    // normal users: approved only
    // faculty/admin can optionally filter by approvalStatus
    const isPrivileged = ['faculty', 'admin'].includes(req.user.role);
    if (isPrivileged && req.query.approvalStatus) {
      if (!ALLOWED_STATUSES.includes(req.query.approvalStatus)) {
        return sendError(res, 400, 'Invalid approvalStatus filter');
      }
      filter.approvalStatus = req.query.approvalStatus;
    } else {
      filter.approvalStatus = 'approved';
    }

    const total = await Resource.countDocuments(filter);
    const resources = await Resource.find(filter)
      .populate('uploader', 'name email role')
      .populate('reviewer', 'name email role')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Resources fetched',
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, `Failed to fetch resources: ${error.message}`);
  }
};

// GET -> localhost:5000/api/resources/pending
// faculty/admin only
exports.getPendingResources = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const total = await Resource.countDocuments({ approvalStatus: 'pending' });
    const resources = await Resource.find({ approvalStatus: 'pending' })
      .populate('uploader', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Pending resources fetched',
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, `Failed to fetch pending resources: ${error.message}`);
  }
};

// PUT -> localhost:5000/api/resources/:id/approve
// faculty/admin only
exports.approveResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) return sendError(res, 404, 'Resource not found');

    resource.approvalStatus = 'approved';
    resource.reviewer = req.user._id;
    resource.reviewedAt = new Date();
    resource.rejectionReason = '';

    await resource.save();

    const notification = await Notification.create({
      user: resource.uploader,
      title: 'Resource Approved',
      message: `Your resource "${resource.title}" has been approved and is now visible.`,
      type: 'success',
      read: false,
    });

    emitNotificationToUser(resource.uploader, notification);

    return res.status(200).json({
      success: true,
      message: 'Resource approved',
      data: resource,
    });
  } catch (error) {
    return sendError(res, 500, `Failed to approve resource: ${error.message}`);
  }
};

// PUT -> localhost:5000/api/resources/:id/reject
// faculty/admin only
exports.rejectResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason = '' } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) return sendError(res, 404, 'Resource not found');

    resource.approvalStatus = 'rejected';
    resource.reviewer = req.user._id;
    resource.reviewedAt = new Date();
    const trimmedRejectionReason = String(rejectionReason).trim();
    resource.rejectionReason = trimmedRejectionReason;

    await resource.save();

    const notification = await Notification.create({
      user: resource.uploader,
      title: 'Resource Rejected',
      message: trimmedRejectionReason
        ? `Your resource "${resource.title}" was rejected. Reason: ${trimmedRejectionReason}`
        : `Your resource "${resource.title}" was rejected. Please review and resubmit.`,
      type: 'warning',
      read: false,
    });

    emitNotificationToUser(resource.uploader, notification);

    return res.status(200).json({
      success: true,
      message: 'Resource rejected',
      data: resource,
    });
  } catch (error) {
    return sendError(res, 500, `Failed to reject resource: ${error.message}`);
  }
};