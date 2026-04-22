const TutoringSession = require('../models/TutoringSession');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Helper to emit notification
const emitNotify = (userId, notification) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:new', notification);
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }
};

// @desc    Create a tutoring session
// @route   POST /api/peer-tutoring
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const { moduleName, description, date, time, endTime, sessionLink, maxStudents } = req.body;

    const session = await TutoringSession.create({
      moduleName,
      description,
      date,
      time,
      endTime,
      sessionLink,
      maxStudents,
      creator: req.user._id,
    });

    // Notify admins about new session submission
    // (Optional: Implement if there's a specific admin notification logic)

    res.status(201).json({
      success: true,
      message: 'Session created successfully and sent for admin approval.',
      session,
    });
  } catch (error) {
    console.error('createSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all approved sessions (excluding creator's own)
// @route   GET /api/peer-tutoring
// @access  Private
exports.getApprovedSessions = async (req, res) => {
  try {
    const sessions = await TutoringSession.find({ 
      approvalStatus: 'approved',
      creator: { $ne: req.user._id } 
    })
      .populate('creator', 'name email avatar')
      .populate('participants', 'name email avatar')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('getApprovedSessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's sessions (created or joined)
// @route   GET /api/peer-tutoring/mine
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await TutoringSession.find({
      $or: [{ creator: req.user._id }, { participants: req.user._id }],
    })
      .populate('creator', 'name email avatar')
      .populate('participants', 'name email avatar')
      .populate('feedbacks.user', 'name email avatar')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('getMySessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sessions for admin review
// @route   GET /api/peer-tutoring/all
// @access  Private/Admin
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await TutoringSession.find()
      .populate('creator', 'name email avatar')
      .populate('participants', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('getAllSessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a tutoring session
// @route   PUT /api/peer-tutoring/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    const updates = req.body;
    // Reset to pending if updated by non-admin
    if (req.user.role !== 'admin') {
      updates.approvalStatus = 'pending';
    }

    const updatedSession = await TutoringSession.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Session updated successfully.',
      session: updatedSession,
    });
  } catch (error) {
    console.error('updateSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a tutoring session
// @route   DELETE /api/peer-tutoring/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }

    await TutoringSession.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('deleteSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a tutoring session
// @route   PUT /api/peer-tutoring/:id/approve
// @access  Private/Admin
exports.approveSession = async (req, res) => {
  try {
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.approvalStatus = 'approved';
    session.rejectionReason = '';
    await session.save();

    const notification = await Notification.create({
      user: session.creator,
      title: 'Session Approved',
      message: `Your tutoring session for "${session.moduleName}" has been approved.`,
      type: 'success',
    });

    emitNotify(session.creator, notification);

    res.json({ success: true, message: 'Session approved.' });
  } catch (error) {
    console.error('approveSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a tutoring session
// @route   PUT /api/peer-tutoring/:id/reject
// @access  Private/Admin
exports.rejectSession = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.approvalStatus = 'rejected';
    session.rejectionReason = rejectionReason || 'No reason provided';
    await session.save();

    const notification = await Notification.create({
      user: session.creator,
      title: 'Session Rejected',
      message: `Your tutoring session for "${session.moduleName}" was rejected. Reason: ${session.rejectionReason}`,
      type: 'error',
    });

    emitNotify(session.creator, notification);

    res.json({ success: true, message: 'Session rejected.' });
  } catch (error) {
    console.error('rejectSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a tutoring session
// @route   POST /api/peer-tutoring/:id/join
// @access  Private
exports.joinSession = async (req, res) => {
  try {
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Cannot join a session that is not approved' });
    }

    if (session.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already joined this session' });
    }

    if (session.participants.length >= session.maxStudents) {
      return res.status(400).json({ message: 'Session is full' });
    }

    session.participants.push(req.user._id);
    await session.save();

    // Notify creator
    await Notification.create({
      user: session.creator,
      title: 'New Student Joined',
      message: `${req.user.name} has joined your session: ${session.moduleName}`,
      type: 'info',
    });

    res.json({ success: true, message: 'Joined session successfully.' });
  } catch (error) {
    console.error('joinSession error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback for a session
// @route   POST /api/peer-tutoring/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isParticipant = session.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Only participants can submit feedback' });
    }

    // Check if feedback already submitted by this user
    const alreadySubmitted = session.feedbacks.some(
      (f) => f.user.toString() === req.user._id.toString()
    );

    if (alreadySubmitted) {
      return res.status(400).json({ message: 'Feedback already submitted' });
    }

    session.feedbacks.push({
      user: req.user._id,
      rating,
      comment,
    });

    await session.save();

    // Notify creator
    await Notification.create({
      user: session.creator,
      title: 'New Feedback Received',
      message: `A student provided feedback for your session: ${session.moduleName}`,
      type: 'success',
    });

    res.json({ success: true, message: 'Feedback submitted successfully.', session });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Notify creator when someone clicks Join Session button
// @route   POST /api/peer-tutoring/:id/notify-attendance
// @access  Private
exports.notifyAttendance = async (req, res) => {
  try {
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const notification = await Notification.create({
      user: session.creator,
      title: 'Session Attendance',
      message: `${req.user.name} has clicked the "Join Session" button for: ${session.moduleName}`,
      type: 'info',
    });

    emitNotify(session.creator, notification);

    res.json({ success: true, message: 'Creator notified of your attendance.' });
  } catch (error) {
    console.error('notifyAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};
