const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../socket');

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
    if (sort === 'most-replies') sortOption = { updatedAt: -1 };

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

exports.getMyThreads = async (req, res) => {
  try {
    const threads = await Thread.find({ authorId: req.user._id }).sort({ createdAt: -1 });
    res.json(threads);
  } catch (error) {
    console.error('getMyThreads error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyRepliedThreads = async (req, res) => {
  try {
    const threads = await Thread.find({ 'replies.authorId': req.user._id }).sort({ updatedAt: -1 });

    const formatted = threads.map((thread) => {
      const myReplies = thread.replies.filter(
        (reply) => String(reply.authorId || '') === String(req.user._id)
      );

      return {
        _id: thread._id,
        title: thread.title,
        topic: thread.topic,
        content: thread.content,
        author: thread.author,
        authorId: thread.authorId,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        replyCount: thread.replies.length,
        myReplies,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('getMyRepliedThreads error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMySavedThreads = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedThreads',
      options: { sort: { updatedAt: -1 } },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.savedThreads || []);
  } catch (error) {
    console.error('getMySavedThreads error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.saveThread = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Invalid thread ID' });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadySaved = user.savedThreads.some(
      (savedId) => String(savedId) === String(thread._id)
    );

    if (alreadySaved) {
      return res.status(400).json({ message: 'Thread already saved' });
    }

    user.savedThreads.push(thread._id);
    await user.save();

    const notification = await Notification.create({
      user: user._id,
      title: 'Thread Saved',
      message: `You saved the discussion "${thread.title}" to your profile.`,
      type: 'success',
      read: false,
    });

    emitNotificationToUser(user._id, notification);

    res.json({ message: 'Thread saved successfully' });
  } catch (error) {
    console.error('saveThread error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.unsaveThread = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Invalid thread ID' });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.savedThreads = user.savedThreads.filter(
      (savedId) => String(savedId) !== String(thread._id)
    );

    await user.save();

    res.json({ message: 'Thread removed from saved discussions' });
  } catch (error) {
    console.error('unsaveThread error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
    console.error('createThread error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
    console.error('updateThread error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
    console.error('deleteThread error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addReply = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Invalid thread ID' });
    }

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

    if (thread.authorId && String(thread.authorId) !== String(req.user._id)) {
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
    console.error('addReply error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateReply = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.replyId)) {
      return res.status(404).json({ message: 'Invalid thread or reply ID' });
    }

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
    console.error('updateReply error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.replyId)) {
      return res.status(404).json({ message: 'Invalid thread or reply ID' });
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

    reply.deleteOne();
    await thread.save();

    res.json(thread);
  } catch (error) {
    console.error('deleteReply error:', error);
    res.status(500).json({ message: error.message });
  }
};