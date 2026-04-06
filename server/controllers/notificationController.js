const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const ALLOWED_TYPES = ['success', 'info', 'warning', 'error'];

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const emitToUser = (userId, eventName, payload) => {
  try {
    getIO().to(`user:${userId}`).emit(eventName, payload);
  } catch (error) {
    console.error(`socket emit error [${eventName}]:`, error.message);
  }
};

// GET ALL NOTIFICATIONS FOR LOGGED-IN USER
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE NOTIFICATION
const createNotification = async (req, res) => {
  try {
    const title = sanitizeText(req.body.title);
    const message = sanitizeText(req.body.message);
    const type = sanitizeText(req.body.type || 'info');

    if (!title) {
      return res.status(400).json({ message: 'Notification title is required' });
    }

    if (title.length < 3 || title.length > 120) {
      return res.status(400).json({ message: 'Notification title must be between 3 and 120 characters' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Notification message is required' });
    }

    if (message.length < 5 || message.length > 1000) {
      return res.status(400).json({ message: 'Notification message must be between 5 and 1000 characters' });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    const notification = await Notification.create({
      user: req.user._id,
      title,
      message,
      type,
      read: false,
    });

    emitToUser(req.user._id, 'notification:new', notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('createNotification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// MARK ONE AS READ
const markNotificationAsRead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    emitToUser(req.user._id, 'notification:updated', {
      _id: notification._id,
      read: true,
    });

    res.json(notification);
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    res.status(500).json({ message: error.message });
  }
};

// MARK ALL AS READ
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    emitToUser(req.user._id, 'notification:all-read', {
      userId: String(req.user._id),
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE NOTIFICATION
const deleteNotification = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    emitToUser(req.user._id, 'notification:deleted', {
      _id: req.params.id,
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};