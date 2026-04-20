const User = require('../models/User');
const Thread = require('../models/Thread');

const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalThreads = await Thread.countDocuments();

    const threads = await Thread.find()
      .populate('replies')
      .sort({ createdAt: -1 });

    const totalReplies = threads.reduce((sum, thread) => {
      return sum + (thread.replies ? thread.replies.length : 0);
    }, 0);

    const totalSavedThreads = await User.aggregate([
      {
        $project: {
          savedCount: {
            $size: { $ifNull: ['$savedThreads', []] },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$savedCount' },
        },
      },
    ]);

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const activeUsers = await User.countDocuments({ status: 'active' });
    const deactivatedUsers = await User.countDocuments({ status: 'deactivated' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });

    const topicAggregation = await Thread.aggregate([
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const latestUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role faculty status createdAt');

    const latestThreads = await Thread.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('replies')
      .select('title topic author replies createdAt');

    return res.status(200).json({
      overview: {
        totalUsers,
        totalThreads,
        totalReplies,
        totalSavedThreads: totalSavedThreads[0]?.total || 0,
        totalStudents,
        totalFaculty,
        totalAdmins,
        activeUsers,
        deactivatedUsers,
        suspendedUsers,
        bannedUsers,
        mostActiveTopic: topicAggregation[0]?._id || 'N/A',
        mostActiveTopicCount: topicAggregation[0]?.count || 0,
      },
      latestUsers,
      latestThreads,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({
      message: 'Failed to fetch administrative analytics',
    });
  }
};

module.exports = { getAdminAnalytics };