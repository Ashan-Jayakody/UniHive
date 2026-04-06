const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ================= VALIDATION HELPERS =================

const sanitize = (text) => (typeof text === 'string' ? text.trim() : '');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateThread = ({ title, topic, content }) => {
  if (!title || title.length < 5 || title.length > 120) {
    return 'Title must be between 5 and 120 characters';
  }

  if (!topic || topic.length < 2 || topic.length > 50) {
    return 'Topic must be between 2 and 50 characters';
  }

  if (!content || content.length < 10 || content.length > 2000) {
    return 'Content must be between 10 and 2000 characters';
  }

  return null;
};

const validateReply = (text) => {
  if (!text || text.length < 1 || text.length > 500) {
    return 'Reply must be between 1 and 500 characters';
  }
  return null;
};

// ================= SOCKET EMIT =================

const emitNotificationToUser = (userId, notification) => {
  try {
    getIO().to(`user:${userId}`).emit('notification:new', notification);
  } catch (error) {
    console.error('emitNotificationToUser error:', error.message);
  }
};

// ================= GET THREADS =================

exports.getAllThreads = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 6, 1);
    const skip = (page - 1) * limit;

    const search = sanitize(req.query.search || '');
    const topic = sanitize(req.query.topic || '');
    const sort = sanitize(req.query.sort || 'latest');

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (topic && topic !== 'All') {
      query.topic = topic;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'latest-activity') sortOption = { updatedAt: -1 };

    const total = await Thread.countDocuments(query);
    const threads = await Thread.find(query).sort(sortOption).skip(skip).limit(limit);

    res.json({
      threads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE THREAD =================

exports.createThread = async (req, res) => {
  try {
    const payload = {
      title: sanitize(req.body.title),
      topic: sanitize(req.body.topic),
      content: sanitize(req.body.content),
    };

    const errorMsg = validateThread(payload);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const thread = await Thread.create({
      ...payload,
      author: req.user?.name || 'User',
      authorId: req.user?._id || null,
      replies: [],
    });

    // notification
    if (req.user?._id) {
      const notification = await Notification.create({
        user: req.user._id,
        title: 'Thread Created',
        message: `Your discussion "${thread.title}" was posted.`,
        type: 'success',
        read: false,
      });

      emitNotificationToUser(req.user._id, notification);
    }

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE THREAD =================

exports.updateThread = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Invalid thread ID' });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const isOwner = String(thread.authorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = {
      title: sanitize(req.body.title ?? thread.title),
      topic: sanitize(req.body.topic ?? thread.topic),
      content: sanitize(req.body.content ?? thread.content),
    };

    const errorMsg = validateThread(updated);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    thread.title = updated.title;
    thread.topic = updated.topic;
    thread.content = updated.content;

    const saved = await thread.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE THREAD =================

exports.deleteThread = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Invalid thread ID' });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const isOwner = String(thread.authorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await User.updateMany(
      { savedThreads: thread._id },
      { $pull: { savedThreads: thread._id } }
    );

    await thread.deleteOne();

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD REPLY =================

exports.addReply = async (req, res) => {
  try {
    const text = sanitize(req.body.text);

    const errorMsg = validateReply(text);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const reply = {
      text,
      author: req.user?.name || 'User',
      authorId: req.user?._id,
      createdAt: new Date(),
    };

    thread.replies.push(reply);
    await thread.save();

    // notify thread owner
    if (
      thread.authorId &&
      String(thread.authorId) !== String(req.user._id)
    ) {
      const notification = await Notification.create({
        user: thread.authorId,
        title: 'New Reply',
        message: `${req.user.name} replied to your thread`,
        type: 'info',
        read: false,
      });

      emitNotificationToUser(thread.authorId, notification);
    }

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE REPLY =================

exports.updateReply = async (req, res) => {
  try {
    const text = sanitize(req.body.text);

    const errorMsg = validateReply(text);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const isOwner = String(reply.authorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reply.text = text;
    await thread.save();

    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE REPLY =================

exports.deleteReply = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const isOwner = String(reply.authorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reply.deleteOne();
    await thread.save();

    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};