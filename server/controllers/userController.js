const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const ALLOWED_ROLES = ['student', 'faculty', 'admin'];
const ALLOWED_STATUSES = ['active', 'deactivated', 'suspended', 'banned'];
const FACULTY_OPTIONS = ['Computing', 'Engineering', 'Business', 'Humanities'];
const COURSE_MAP = {
  Computing: ['Software Engineering', 'Computer Science', 'Cyber Security', 'Data Science'],
  Engineering: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
  Business: ['Business Administration', 'Accounting', 'Finance', 'Marketing'],
  Humanities: ['Psychology', 'English', 'International Relations'],
};
const ACADEMIC_YEAR_OPTIONS = ['1', '2', '3', '4'];

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => sanitizeText(value).toLowerCase();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseExpertiseAreas = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item))
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .slice(0, 10);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .slice(0, 10);
  }

  return [];
};

const validateExpertiseAreas = (areas) => {
  if (!Array.isArray(areas)) return 'Expertise areas must be an array or comma-separated text.';
  if (areas.some((item) => item.length > 40)) {
    return 'Each expertise area must be 40 characters or less.';
  }
  return null;
};

const validateProfilePayload = ({ name, email, password, expertiseAreas }) => {
  const cleanName = sanitizeText(name);
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) return 'Full name is required.';
  if (!NAME_REGEX.test(cleanName)) return 'Please enter a valid full name.';

  if (!cleanEmail) return 'Email address is required.';
  if (!EMAIL_REGEX.test(cleanEmail)) return 'Please enter a valid email address.';

  if (password && !PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  }

  const expertiseError = validateExpertiseAreas(expertiseAreas);
  if (expertiseError) return expertiseError;

  return null;
};

const validateAdminUserPayload = ({
  name,
  email,
  role,
  status,
  points,
  helperBadge,
  emailVerified,
  phoneVerified,
  expertiseAreas,
  faculty,
  course,
  academicYear,
}) => {
  const cleanName = sanitizeText(name);
  const cleanEmail = normalizeEmail(email);
  const cleanRole = sanitizeText(role);
  const cleanStatus = sanitizeText(status);
  const cleanFaculty = sanitizeText(faculty);
  const cleanCourse = sanitizeText(course);
  const cleanAcademicYear =
    academicYear === null || academicYear === undefined ? '' : String(academicYear).trim();

  if (!cleanName) return 'Full name is required.';
  if (!NAME_REGEX.test(cleanName)) return 'Please enter a valid full name.';

  if (!cleanEmail) return 'Email address is required.';
  if (!EMAIL_REGEX.test(cleanEmail)) return 'Please enter a valid email address.';

  if (!ALLOWED_ROLES.includes(cleanRole)) return 'Please select a valid role.';
  if (!ALLOWED_STATUSES.includes(cleanStatus)) return 'Please select a valid status.';

  if (typeof points !== 'number' || Number.isNaN(points) || points < 0) {
    return 'Points must be a valid non-negative number.';
  }

  if (typeof helperBadge !== 'boolean') return 'Helper badge must be true or false.';
  if (typeof emailVerified !== 'boolean') return 'Email verified must be true or false.';
  if (typeof phoneVerified !== 'boolean') return 'Phone verified must be true or false.';

  const expertiseError = validateExpertiseAreas(expertiseAreas);
  if (expertiseError) return expertiseError;

  if (cleanRole !== 'admin') {
    if (!cleanFaculty) return 'Faculty is required.';
    if (!FACULTY_OPTIONS.includes(cleanFaculty)) return 'Please select a valid faculty.';
  }

  if (cleanRole === 'student') {
    if (!cleanCourse) return 'Course is required for students.';
    if (!cleanAcademicYear) return 'Academic year is required for students.';

    const validCourses = COURSE_MAP[cleanFaculty] || [];
    if (!validCourses.includes(cleanCourse)) {
      return 'Please select a valid course for the selected faculty.';
    }

    if (!ACADEMIC_YEAR_OPTIONS.includes(cleanAcademicYear)) {
      return 'Please select a valid academic year.';
    }
  }

  return null;
};

const buildSafeUserResponse = (user) => ({
  _id: user._id,
  name: user.name || '',
  email: user.email || '',
  role: user.role || '',
  faculty: user.faculty || '',
  course: user.course || '',
  academicYear: user.academicYear ?? '',
  expertiseAreas: user.expertiseAreas || [],
  status: user.status || 'active',
  points: user.points ?? 0,
  helperBadge: user.helperBadge ?? false,
  emailVerified: user.emailVerified ?? false,
  phoneVerified: user.phoneVerified ?? false,
  avatar: user.avatar || '',
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
});

// GET LOGGED-IN USER PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(buildSafeUserResponse(user));
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

    const payload = {
      name: sanitizeText(req.body.name ?? user.name),
      email: normalizeEmail(req.body.email ?? user.email),
      password: typeof req.body.password === 'string' ? req.body.password : '',
      avatar: req.body.avatar ?? user.avatar ?? '',
      expertiseAreas: parseExpertiseAreas(
        req.body.expertiseAreas ?? user.expertiseAreas ?? []
      ),
    };

    const validationError = validateProfilePayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingEmailUser = await User.findOne({
      email: payload.email,
      _id: { $ne: user._id },
    });

    if (existingEmailUser) {
      return res.status(400).json({ message: 'Another user already uses this email address.' });
    }

    const oldName = user.name;
    const oldEmail = user.email;
    const oldAvatar = user.avatar || '';

    user.name = payload.name;
    user.email = payload.email;
    user.avatar = payload.avatar;
    user.expertiseAreas = payload.expertiseAreas;

    if (payload.password && payload.password.trim()) {
      user.password = payload.password;
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
    } else if (payload.password && payload.password.trim()) {
      notificationMessage = 'Your profile was updated successfully, including your password.';
    }

    await Notification.create({
      user: updatedUser._id,
      title: 'Profile Updated',
      message: notificationMessage,
      type: 'success',
      read: false,
    });

    res.json(buildSafeUserResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: GET ALL USERS WITH SEARCH/FILTER/PAGINATION
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 8, 1);
    const skip = (page - 1) * limit;

    const search = sanitizeText(req.query.search || '');
    const role = sanitizeText(req.query.role || '');
    const status = sanitizeText(req.query.status || '');
    const faculty = sanitizeText(req.query.faculty || '');
    const sort = sanitizeText(req.query.sort || 'newest');

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

    if (role && ALLOWED_ROLES.includes(role)) query.role = role;
    if (status && ALLOWED_STATUSES.includes(status)) query.status = status;
    if (faculty && FACULTY_OPTIONS.includes(faculty)) query.faculty = faculty;

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
    const search = sanitizeText(req.query.search || '');
    const role = sanitizeText(req.query.role || '');
    const status = sanitizeText(req.query.status || '');
    const faculty = sanitizeText(req.query.faculty || '');
    const sort = sanitizeText(req.query.sort || 'newest');

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

    if (role && ALLOWED_ROLES.includes(role)) query.role = role;
    if (status && ALLOWED_STATUSES.includes(status)) query.status = status;
    if (faculty && FACULTY_OPTIONS.includes(faculty)) query.faculty = faculty;

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
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = {
      name: sanitizeText(req.body.name ?? user.name),
      email: normalizeEmail(req.body.email ?? user.email),
      role: sanitizeText(req.body.role ?? user.role),
      status: sanitizeText(req.body.status ?? user.status),
      points:
        req.body.points === undefined || req.body.points === null
          ? user.points ?? 0
          : Number(req.body.points),
      helperBadge:
        typeof req.body.helperBadge === 'boolean' ? req.body.helperBadge : user.helperBadge ?? false,
      emailVerified:
        typeof req.body.emailVerified === 'boolean'
          ? req.body.emailVerified
          : user.emailVerified ?? false,
      phoneVerified:
        typeof req.body.phoneVerified === 'boolean'
          ? req.body.phoneVerified
          : user.phoneVerified ?? false,
      avatar: req.body.avatar ?? user.avatar ?? '',
      expertiseAreas: parseExpertiseAreas(req.body.expertiseAreas ?? user.expertiseAreas ?? []),
      faculty: sanitizeText(req.body.faculty ?? user.faculty),
      course: sanitizeText(req.body.course ?? user.course),
      academicYear:
        req.body.academicYear === null || req.body.academicYear === undefined
          ? user.academicYear ?? ''
          : String(req.body.academicYear).trim(),
    };

    const validationError = validateAdminUserPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingEmailUser = await User.findOne({
      email: payload.email,
      _id: { $ne: user._id },
    });

    if (existingEmailUser) {
      return res.status(400).json({ message: 'Another user already uses this email address.' });
    }

    const previousStatus = user.status;
    const previousRole = user.role;

    user.name = payload.name;
    user.email = payload.email;
    user.role = payload.role;
    user.status = payload.status;
    user.points = payload.points;
    user.helperBadge = payload.helperBadge;
    user.emailVerified = payload.emailVerified;
    user.phoneVerified = payload.phoneVerified;
    user.avatar = payload.avatar;
    user.expertiseAreas = payload.expertiseAreas;

    if (user.role === 'student') {
      user.faculty = payload.faculty;
      user.course = payload.course;
      user.academicYear = Number(payload.academicYear);
    }

    if (user.role === 'faculty') {
      user.faculty = payload.faculty;
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
      user: buildSafeUserResponse(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

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