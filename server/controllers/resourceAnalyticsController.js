const Resource = require('../models/Resource');

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
    data: null,
  });

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

exports.getResourceAnalytics = async (req, res) => {
  try {
    const days = Number.parseInt(req.query.days, 10);
    const rangeDays = Number.isInteger(days) && days > 0 ? days : 30;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (rangeDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const [
      totalUploads,
      approvedCount,
      pendingCount,
      rejectedCount,
      avgReviewHoursRaw,
      categoryDistribution,
      topSubjects,
      topUploaders,
      rejectionReasons,
      uploadsTrendRaw,
      approvedTrendRaw,
      pendingRaw,
    ] = await Promise.all([
      Resource.countDocuments(),
      Resource.countDocuments({ approvalStatus: 'approved' }),
      Resource.countDocuments({ approvalStatus: 'pending' }),
      Resource.countDocuments({ approvalStatus: 'rejected' }),
      Resource.aggregate([
        {
          $match: {
            approvalStatus: { $in: ['approved', 'rejected'] },
            reviewedAt: { $ne: null },
            createdAt: { $ne: null },
          },
        },
        {
          $project: {
            reviewHours: {
              $divide: [{ $subtract: ['$reviewedAt', '$createdAt'] }, 1000 * 60 * 60],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgReviewHours: { $avg: '$reviewHours' },
          },
        },
      ]),
      Resource.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Resource.aggregate([
        {
          $group: {
            _id: '$subject',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Resource.aggregate([
        {
          $group: {
            _id: '$uploader',
            uploads: { $sum: 1 },
          },
        },
        { $sort: { uploads: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'uploaderInfo',
          },
        },
        {
          $project: {
            _id: 0,
            uploaderId: '$_id',
            uploads: 1,
            name: {
              $ifNull: [{ $arrayElemAt: ['$uploaderInfo.name', 0] }, 'Unknown'],
            },
            email: {
              $ifNull: [{ $arrayElemAt: ['$uploaderInfo.email', 0] }, ''],
            },
          },
        },
      ]),
      Resource.aggregate([
        {
          $match: {
            approvalStatus: 'rejected',
            rejectionReason: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$rejectionReason',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Resource.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            uploads: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Resource.aggregate([
        {
          $match: {
            approvalStatus: 'approved',
            reviewedAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt' },
            },
            approved: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Resource.find({ approvalStatus: 'pending' }).select('createdAt'),
    ]);

    const approvalRate = totalUploads > 0 ? round2((approvedCount / totalUploads) * 100) : 0;
    const rejectionRate = totalUploads > 0 ? round2((rejectedCount / totalUploads) * 100) : 0;
    const avgReviewHours = avgReviewHoursRaw[0]?.avgReviewHours
      ? round2(avgReviewHoursRaw[0].avgReviewHours)
      : 0;

    const uploadsByDayMap = Object.fromEntries(uploadsTrendRaw.map((item) => [item._id, item.uploads]));
    const approvedByDayMap = Object.fromEntries(approvedTrendRaw.map((item) => [item._id, item.approved]));

    const trend = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trend.push({
        date: key,
        uploads: uploadsByDayMap[key] || 0,
        approved: approvedByDayMap[key] || 0,
      });
    }

    const pendingAging = {
      lessThan2Days: 0,
      between2And7Days: 0,
      moreThan7Days: 0,
    };

    for (const item of pendingRaw) {
      const createdAt = new Date(item.createdAt);
      const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);

      if (ageDays < 2) pendingAging.lessThan2Days += 1;
      else if (ageDays <= 7) pendingAging.between2And7Days += 1;
      else pendingAging.moreThan7Days += 1;
    }

    return res.status(200).json({
      success: true,
      message: 'Resource analytics fetched',
      data: {
        overview: {
          totalUploads,
          approvedCount,
          pendingCount,
          rejectedCount,
          approvalRate,
          rejectionRate,
          avgReviewHours,
        },
        distribution: {
          byCategory: categoryDistribution.map((item) => ({
            category: item._id || 'Unknown',
            count: item.count,
          })),
          topSubjects: topSubjects.map((item) => ({
            subject: item._id || 'Unknown',
            count: item.count,
          })),
        },
        moderation: {
          rejectionReasons: rejectionReasons.map((item) => ({
            reason: item._id || 'No reason',
            count: item.count,
          })),
          pendingAging,
        },
        topUploaders,
        trend,
      },
    });
  } catch (error) {
    return sendError(res, 500, `Failed to fetch resource analytics: ${error.message}`);
  }
};
