const User = require('../models/User');
const Thread = require('../models/Thread');

exports.getAdminAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      activeUsers,
      deactivatedUsers,
      suspendedUsers,
      bannedUsers,
      totalThreads,
      usersWithSavedThreads,
      latestUsers,
      latestThreads,
      allThreads,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'deactivated' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'banned' }),
      Thread.countDocuments(),
      User.find({ savedThreads: { $exists: true, $ne: [] } }).select('savedThreads'),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Thread.find().sort({ createdAt: -1 }).limit(5),
      Thread.find().select('topic replies'),
    ]);

    const totalReplies = allThreads.reduce(
      (sum, thread) => sum + (Array.isArray(thread.replies) ? thread.replies.length : 0),
      0
    );

    const totalSavedThreads = usersWithSavedThreads.reduce(
      (sum, user) => sum + (Array.isArray(user.savedThreads) ? user.savedThreads.length : 0),
      0
    );

    const topicMap = {};
    for (const thread of allThreads) {
      const topic = thread.topic || 'General';
      topicMap[topic] = (topicMap[topic] || 0) + 1;
    }

    let mostActiveTopic = 'N/A';
    let mostActiveTopicCount = 0;

    for (const [topic, count] of Object.entries(topicMap)) {
      if (count > mostActiveTopicCount) {
        mostActiveTopic = topic;
        mostActiveTopicCount = count;
      }
    }

    res.json({
      overview: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAdmins,
        activeUsers,
        deactivatedUsers,
        suspendedUsers,
        bannedUsers,
        totalThreads,
        totalReplies,
        totalSavedThreads,
        mostActiveTopic,
        mostActiveTopicCount,
      },
      latestUsers,
      latestThreads,
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    res.status(500).json({ message: error.message });
  }
};