const PeerTutoringSession = require('../models/PeerTutoringSession');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const emitNotificationToUser = (userId, notification) => {
  try {
    getIO().to(`user:${userId}`).emit('notification:new', notification);
  } catch (error) {
    console.error('emitNotificationToUser error:', error.message);
  }
};

const validateSessionPayload = ({ moduleName, description, date, time, endTime, sessionLink, maxStudents }) => {
  const errors = {};
  let normalizedDate = null;

  if (!moduleName || !String(moduleName).trim()) {
    errors.moduleName = 'Module name is required.';
  }
  if (!description || !String(description).trim()) {
    errors.description = 'Description is required.';
  }

  normalizedDate = normalizeDate(date);
  if (!date || !normalizedDate) {
    errors.date = 'A valid session date is required.';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (normalizedDate < today) {
      errors.date = 'The date cannot be in the past.';
    }
  }

  if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    errors.time = 'A valid session time is required.';
  }

  if (!endTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
    errors.endTime = 'A valid session end time is required.';
  }

  if (!sessionLink || !String(sessionLink).trim()) {
    errors.sessionLink = 'Session link is required.';
  } else if (!isValidUrl(sessionLink)) {
    errors.sessionLink = 'Session link must begin with http:// or https://.';
  }

  const maxCount = Number(maxStudents);
  if (!maxStudents || !String(maxStudents).trim()) {
    errors.maxStudents = 'Maximum student count is required.';
  } else if (!Number.isInteger(maxCount) || maxCount <= 0) {
    errors.maxStudents = 'Maximum student count must be a positive whole number.';
  }

  return { errors, normalizedDate, maxCount };
};

const createPeerTutoringSession = async (req, res) => {
  try {
    const { moduleName, description, date, time, endTime, sessionLink, maxStudents } = req.body;
    const { errors, normalizedDate, maxCount } = validateSessionPayload({
      moduleName,
      description,
      date,
      time,
      endTime,
      sessionLink,
      maxStudents,
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, errors });
    }

    const existingSession = await PeerTutoringSession.findOne({
      creator: req.user._id,
      date: normalizedDate,
      time,
      status: 'scheduled',
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'You already have a session scheduled at the same date and time.',
      });
    }

    const session = await PeerTutoringSession.create({
      creator: req.user._id,
      moduleName: String(moduleName).trim(),
      description: String(description).trim(),
      date: normalizedDate,
      time,
      endTime,
      sessionLink: String(sessionLink).trim(),
      maxStudents: maxCount,
      approvalStatus: 'pending',
      participants: [],
    });

    return res.status(201).json({ success: true, session });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a session scheduled at the same date and time.',
      });
    }

    console.error('Peer tutoring creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create peer tutoring session.',
      details: error.message,
    });
  }
};

const getPeerTutoringSessions = async (req, res) => {
  try {
    const sessions = await PeerTutoringSession.find({
      approvalStatus: 'approved',
      creator: { $ne: req.user._id },
    })
      .populate('creator', 'name email role')
      .populate('participants', 'name email')
      .sort({ date: 1, time: 1 });

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Get peer tutoring sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
};

const getPendingPeerTutoringSessions = async (req, res) => {
  try {
    const sessions = await PeerTutoringSession.find({ approvalStatus: 'pending' })
      .populate('creator', 'name email role')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Get pending peer tutoring sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending sessions.' });
  }
};

const getAllPeerTutoringSessions = async (req, res) => {
  try {
    const sessions = await PeerTutoringSession.find()
      .populate('creator', 'name email role')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Get all peer tutoring sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
};

const approvePeerTutoringSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.approvalStatus = 'approved';
    session.reviewer = req.user._id;
    session.reviewedAt = new Date();
    session.rejectionReason = '';

    await session.save();

    const notification = await Notification.create({
      user: session.creator,
      title: 'Peer tutoring session approved',
      message: `Your peer tutoring session for ${session.moduleName} has been approved and is now visible to all students.`,
      type: 'success',
      read: false,
    });

    emitNotificationToUser(session.creator, notification);

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Approve peer tutoring session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve session.' });
  }
};

const joinPeerTutoringSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.approvalStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'You can only join approved sessions.' });
    }

    if (session.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot join your own session.' });
    }

    if (session.participants.some((participant) => participant.toString() === req.user._id.toString())) {
      return res.status(200).json({ success: true, message: 'You are already joined to this session.', session });
    }

    if (session.participants.length >= session.maxStudents) {
      return res.status(400).json({ success: false, message: 'This session is already full.' });
    }

    session.participants.push(req.user._id);
    await session.save();

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Join peer tutoring session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to join session.' });
  }
};

const rejectPeerTutoringSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason = '' } = req.body;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.approvalStatus = 'rejected';
    session.reviewer = req.user._id;
    session.reviewedAt = new Date();
    session.rejectionReason = String(rejectionReason).trim();

    await session.save();

    const notification = await Notification.create({
      user: session.creator,
      title: 'Peer tutoring session rejected',
      message: session.rejectionReason
        ? `Your peer tutoring session for ${session.moduleName} was rejected. Reason: ${session.rejectionReason}`
        : `Your peer tutoring session for ${session.moduleName} was rejected. Please review the details and submit again.`,
      type: 'warning',
      read: false,
    });

    emitNotificationToUser(session.creator, notification);

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Reject peer tutoring session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject session.' });
  }
};

const updatePeerTutoringSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { moduleName, description, date, time, endTime, sessionLink, maxStudents } = req.body;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only modify your own session.' });
    }

    const { errors, normalizedDate, maxCount } = validateSessionPayload({
      moduleName,
      description,
      date,
      time,
      endTime,
      sessionLink,
      maxStudents,
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, errors });
    }

    const existingSession = await PeerTutoringSession.findOne({
      _id: { $ne: id },
      creator: req.user._id,
      date: normalizedDate,
      time,
      status: 'scheduled',
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'You already have another session scheduled at the same date and time.',
      });
    }

    session.moduleName = String(moduleName).trim();
    session.description = String(description).trim();
    session.date = normalizedDate;
    session.time = time;
    session.endTime = endTime;
    session.sessionLink = String(sessionLink).trim();
    session.maxStudents = maxCount;
    session.approvalStatus = 'pending';
    session.reviewer = null;
    session.reviewedAt = null;
    session.rejectionReason = '';

    await session.save();

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Update peer tutoring session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update session.' });
  }
};

const deletePeerTutoringSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own session.' });
    }

    await session.deleteOne();

    return res.status(200).json({ success: true, message: 'Session deleted successfully.', data: { _id: id } });
  } catch (error) {
    console.error('Delete peer tutoring session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete session.' });
  }
};

const getMyPeerTutoringSessions = async (req, res) => {
  try {
    const sessions = await PeerTutoringSession.find({ creator: req.user._id })
      .populate('creator', 'name email')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Get my peer tutoring sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your sessions.' });
  }
};

const addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;
    const session = await PeerTutoringSession.findById(id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (!session.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Only participants can leave feedback.' });
    }

    if (session.feedbacks.some((fb) => fb.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this session.' });
    }

    session.feedbacks.push({
      user: req.user._id,
      comment: String(comment).trim(),
      rating: Number(rating),
    });

    await session.save();
    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Add feedback error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add feedback.' });
  }
};

module.exports = {
  createPeerTutoringSession,
  getPeerTutoringSessions,
  getPendingPeerTutoringSessions,
  getAllPeerTutoringSessions,
  approvePeerTutoringSession,
  rejectPeerTutoringSession,
  updatePeerTutoringSession,
  deletePeerTutoringSession,
  getMyPeerTutoringSessions,
  joinPeerTutoringSession,
  addFeedback,
};
