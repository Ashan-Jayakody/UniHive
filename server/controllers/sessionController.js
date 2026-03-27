const Session = require('../models/Session');
const Enrollment = require('../models/Enrollment');
const SessionFeedback = require('../models/SessionFeedback');
const Notification = require('../models/Notification');

// Create a new session
exports.createSession = async (req, res) => {
    try {
        const { topic, description, date, time, capacity, meetingLink } = req.body;
        
        // Basic Validation
        if (!topic || topic.length < 5) {
            return res.status(400).json({ message: 'Topic is required and must be at least 5 characters long.' });
        }
        if (!description || description.length < 10) {
            return res.status(400).json({ message: 'Description is required and must be at least 10 characters long.' });
        }
        if (!date) {
            return res.status(400).json({ message: 'Date is required.' });
        }
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Session date cannot be in the past.' });
        }

        if (!capacity || parseInt(capacity) <= 0) {
            return res.status(400).json({ message: 'Capacity must be a positive number.' });
        }

        if (!meetingLink || !meetingLink.startsWith('http')) {
            return res.status(400).json({ message: 'A valid meeting link (starting with http/https) is required.' });
        }

        const newSession = new Session({
            tutor: req.user.id,
            topic,
            description,
            date,
            time,
            capacity: parseInt(capacity),
            meetingLink,
            status: 'Pending'
        });

        const savedSession = await newSession.save();
        res.status(201).json(savedSession);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a session (Tutor who created it only)
exports.updateSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Only the tutor who created the session can update it
        if (session.tutor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit sessions you created' });
        }


        const { topic, description, date, time, capacity, meetingLink } = req.body;

        // Same validation as create
        if (!topic || topic.length < 5) {
            return res.status(400).json({ message: 'Topic is required and must be at least 5 characters long.' });
        }
        if (!description || description.length < 10) {
            return res.status(400).json({ message: 'Description is required and must be at least 10 characters long.' });
        }
        if (!date) {
            return res.status(400).json({ message: 'Date is required.' });
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Session date cannot be in the past.' });
        }

        if (!capacity || parseInt(capacity) <= 0) {
            return res.status(400).json({ message: 'Capacity must be a positive number.' });
        }

        if (!meetingLink || !meetingLink.startsWith('http')) {
            return res.status(400).json({ message: 'A valid meeting link (starting with http/https) is required.' });
        }

        session.topic = topic;
        session.description = description;
        session.date = date;
        session.time = time;
        session.capacity = parseInt(capacity);
        session.meetingLink = meetingLink;

        const updatedSession = await session.save();
        res.status(200).json(updatedSession);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a session (Tutor who created it or Admin)
exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Only the tutor who created the session or an admin can delete it
        if (session.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You do not have permission to delete this session' });
        }

        // Clean up related data
        await Enrollment.deleteMany({ session: session._id });
        await SessionFeedback.deleteMany({ session: session._id });
        await Session.findByIdAndDelete(session._id);

        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all sessions (filtered by status and role)
exports.getAllSessions = async (req, res) => {
    try {
        let filter = {};
        
        // If not admin, restrict visibility
        if (req.user.role !== 'admin') {
            // Students/Faculty should see all approved sessions
            // Tutors (Faculty/Student) should also see their own pending/rejected sessions
            filter = {
                $or: [
                    { status: 'Approved' },
                    { tutor: req.user.id }
                ]
            };
        } else {
          // Admin can filter by status if query param provided
          const { status } = req.query;
          if (status) filter.status = status;
        }

        const sessions = await Session.find(filter)
            .populate('tutor', 'name email avatar role')
            .sort({ createdAt: -1 })
            .lean();
            
        // Add feedback stats to each session
        const sessionsWithStats = await Promise.all(sessions.map(async (s) => {
            const feedbacks = await SessionFeedback.find({ session: s._id });
            const reviewCount = feedbacks.length;
            const averageRating = reviewCount > 0 
                ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / reviewCount).toFixed(1) 
                : 0;
            return { ...s, reviewCount, averageRating: parseFloat(averageRating) };
        }));

        res.status(200).json(sessionsWithStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single session by ID
exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('tutor', 'name email avatar role').lean();
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const feedbacks = await SessionFeedback.find({ session: session._id });
        const reviewCount = feedbacks.length;
        const averageRating = reviewCount > 0 
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / reviewCount).toFixed(1) 
            : 0;

        res.status(200).json({ 
            ...session, 
            reviewCount, 
            averageRating: parseFloat(averageRating) 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Approve/Reject a session (Admin only)
exports.updateSessionStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can approve/reject sessions' });
        }

        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.status = status;
        await session.save();

        // Notify Tutor
        await Notification.create({
            user: session.tutor,
            title: `Session ${status}`,
            message: `Your tutoring session on "${session.topic}" has been ${status.toLowerCase()} by the administrator.`,
            type: status === 'Approved' ? 'success' : 'error',
            link: `/peerTutoring?sessionId=${session._id}`
        });

        res.status(200).json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Enroll in a session
exports.enrollSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        
        if (session.status !== 'Approved') {
            return res.status(400).json({ message: 'Cannot enroll in a session that is not approved' });
        }

        if (session.tutor.toString() === req.user.id) {
            return res.status(400).json({ message: 'Tutors cannot enroll in their own sessions' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ session: session._id, student: req.user.id });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already registered for this session' });
        }

        // Check capacity
        const enrollmentCount = await Enrollment.countDocuments({ session: session._id, status: 'Registered' });
        if (enrollmentCount >= session.capacity) {
            return res.status(400).json({ message: 'This session is already full' });
        }

        const enrollment = new Enrollment({
            session: session._id,
            student: req.user.id
        });

        await enrollment.save();
        
        // Update session participants array for quick access (optional but helpful)
        await Session.findByIdAndUpdate(session._id, { $addToSet: { participants: req.user.id } });

        res.status(201).json({ message: 'Successfully registered for session', enrollment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get current user's enrollments
exports.getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id })
            .populate({
                path: 'session',
                populate: { path: 'tutor', select: 'name email avatar' }
            });
        res.status(200).json(enrollments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get participants for a session (Session owner or Admin only)
exports.getSessionParticipants = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const participants = await Enrollment.find({ session: req.params.id }).populate('student', 'name email avatar');
        res.status(200).json(participants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Submit feedback for a session
exports.submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const sessionId = req.params.id;

        // Check if session exists
        const session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Check if user was enrolled
        const enrollment = await Enrollment.findOne({ session: sessionId, student: req.user.id });
        if (!enrollment) {
            return res.status(403).json({ message: 'You can only provide feedback for sessions you were registered for' });
        }

        // Check if date has passed (simplistic check)
        const sessionDate = new Date(session.date);
        if (sessionDate > new Date()) {
            return res.status(400).json({ message: 'You can only provide feedback after the session has started' });
        }

        const feedback = new SessionFeedback({
            session: sessionId,
            student: req.user.id,
            rating,
            comment
        });

        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already submitted feedback for this session' });
        }
        res.status(500).json({ message: err.message });
    }
};

// Get feedback for a session
exports.getSessionFeedback = async (req, res) => {
    try {
        const feedback = await SessionFeedback.find({ session: req.params.id })
            .populate('student', 'name avatar');
        res.status(200).json(feedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Mock "Send Reminders" to participants (Tutor or Admin only)
exports.sendReminders = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.tutor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const enrollments = await Enrollment.find({ session: req.params.id }).populate('student', 'name');
        
        if (enrollments.length === 0) {
            return res.status(200).json({ message: 'No participants to notify' });
        }

        // Create notification for each student
        const notifications = enrollments.map(e => ({
            user: e.student._id,
            title: 'Session Reminder',
            message: `Reminder: The session "${session.topic}" is scheduled to start on ${new Date(session.date).toLocaleDateString()} at ${session.time}.`,
            type: 'info',
            link: `/peerTutoring?sessionId=${session._id}`
        }));

        await Notification.insertMany(notifications);

        res.status(200).json({ message: `Successfully sent reminders to ${enrollments.length} participants.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
