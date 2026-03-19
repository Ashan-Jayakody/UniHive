const Notification = require('../models/Notification');

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
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      user: req.user._id,
      title,
      message,
      type: type || 'info',
      read: false,
    });

    getIO().to(`user:${req.user._id}`).emit('notification:new', notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('createNotification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// MARK ONE AS READ
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    getIO().to(`user:${req.user._id}`).emit('notification:updated', {
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

    getIO().to(`user:${req.user._id}`).emit('notification:all-read');

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE NOTIFICATION
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    getIO().to(`user:${req.user._id}`).emit('notification:deleted', {
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