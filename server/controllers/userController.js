const User = require('../models/User');
const Notification = require('../models/Notification');

// GET LOGGED-IN USER PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      faculty: user.faculty || '',
      course: user.course || '',
      academicYear: user.academicYear ?? '',
      status: user.status || 'active',
      points: user.points ?? 0,
      helperBadge: user.helperBadge ?? false,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      avatar: user.avatar || '',
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE OWN PROFILE + AUTO NOTIFICATION
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldName = user.name;
    const oldEmail = user.email;
    const oldAvatar = user.avatar || '';

    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;
    user.avatar = req.body.avatar ?? user.avatar;

    if (req.body.password && req.body.password.trim()) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    let notificationMessage = 'Your profile was updated successfully.';

    if (oldAvatar !== (updatedUser.avatar || '')) {
      notificationMessage = 'Your profile was updated successfully, including your avatar.';
    } else if (oldName !== updatedUser.name && oldEmail !== updatedUser.email) {
      notificationMessage = `Your profile was updated. Name changed to "${updatedUser.name}" and email changed to "${updatedUser.email}".`;
    } else if (oldName !== updatedUser.name) {
      notificationMessage = `Your profile was updated. Name changed to "${updatedUser.name}".`;
    } else if (oldEmail !== updatedUser.email) {
      notificationMessage = `Your profile was updated. Email changed to "${updatedUser.email}".`;
    } else if (req.body.password && req.body.password.trim()) {
      notificationMessage = 'Your profile was updated successfully, including your password.';
    }

    await Notification.create({
      user: updatedUser._id,
      title: 'Profile Updated',
      message: notificationMessage,
      type: 'success',
      read: false,
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name || '',
      email: updatedUser.email || '',
      role: updatedUser.role || '',
      faculty: updatedUser.faculty || '',
      course: updatedUser.course || '',
      academicYear: updatedUser.academicYear ?? '',
      status: updatedUser.status || 'active',
      points: updatedUser.points ?? 0,
      helperBadge: updatedUser.helperBadge ?? false,
      emailVerified: updatedUser.emailVerified ?? false,
      phoneVerified: updatedUser.phoneVerified ?? false,
      avatar: updatedUser.avatar || '',
      createdAt: updatedUser.createdAt || null,
      updatedAt: updatedUser.updatedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: GET ALL USERS WITH SEARCH/FILTER/PAGINATION
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 8, 1);
    const skip = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    const status = (req.query.status || '').trim();
    const faculty = (req.query.faculty || '').trim();
    const sort = (req.query.sort || 'newest').trim();

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { faculty: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;
    if (faculty) query.faculty = faculty;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name-asc') sortOption = { name: 1 };
    if (sort === 'name-desc') sortOption = { name: -1 };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: EXPORT USERS TO CSV
exports.exportUsersCsv = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    const status = (req.query.status || '').trim();
    const faculty = (req.query.faculty || '').trim();
    const sort = (req.query.sort || 'newest').trim();

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { faculty: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;
    if (faculty) query.faculty = faculty;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name-asc') sortOption = { name: 1 };
    if (sort === 'name-desc') sortOption = { name: -1 };

    const users = await User.find(query).select('-password').sort(sortOption);

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Name',
      'Email',
      'Role',
      'Faculty',
      'Course',
      'Academic Year',
      'Status',
      'Points',
      'Helper Badge',
      'Email Verified',
      'Phone Verified',
      'Created At',
      'Updated At',
    ];

    const rows = users.map((user) => [
      escapeCsv(user.name),
      escapeCsv(user.email),
      escapeCsv(user.role),
      escapeCsv(user.faculty || ''),
      escapeCsv(user.course || ''),
      escapeCsv(user.academicYear ?? ''),
      escapeCsv(user.status || 'active'),
      escapeCsv(user.points ?? 0),
      escapeCsv(user.helperBadge ? 'Yes' : 'No'),
      escapeCsv(user.emailVerified ? 'Yes' : 'No'),
      escapeCsv(user.phoneVerified ? 'Yes' : 'No'),
      escapeCsv(user.createdAt ? new Date(user.createdAt).toLocaleString() : ''),
      escapeCsv(user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="unihive-users.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportUsersCsv error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const previousStatus = user.status;
    const previousRole = user.role;

    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;
    user.role = req.body.role ?? user.role;
    user.status = req.body.status ?? user.status;
    user.points = req.body.points ?? user.points;
    user.helperBadge = req.body.helperBadge ?? user.helperBadge;
    user.emailVerified = req.body.emailVerified ?? user.emailVerified;
    user.phoneVerified = req.body.phoneVerified ?? user.phoneVerified;
    user.avatar = req.body.avatar ?? user.avatar;

    if (user.role === 'student') {
      user.faculty = req.body.faculty ?? user.faculty;
      user.course = req.body.course ?? user.course;
      user.academicYear = req.body.academicYear ?? user.academicYear;
    }

    if (user.role === 'faculty') {
      user.faculty = req.body.faculty ?? user.faculty;
      user.course = '';
      user.academicYear = null;
    }

    if (user.role === 'admin') {
      user.faculty = '';
      user.course = '';
      user.academicYear = null;
    }

    const updatedUser = await user.save();

    if (previousStatus !== updatedUser.status) {
      await Notification.create({
        user: updatedUser._id,
        title: 'Account Status Updated',
        message: `Your account status was changed from "${previousStatus}" to "${updatedUser.status}".`,
        type: updatedUser.status === 'active' ? 'success' : 'warning',
        read: false,
      });
    }

    if (previousRole !== updatedUser.role) {
      await Notification.create({
        user: updatedUser._id,
        title: 'Role Updated',
        message: `Your account role was changed from "${previousRole}" to "${updatedUser.role}".`,
        type: 'info',
        read: false,
      });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        faculty: updatedUser.faculty,
        course: updatedUser.course,
        academicYear: updatedUser.academicYear,
        status: updatedUser.status,
        points: updatedUser.points,
        helperBadge: updatedUser.helperBadge,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};