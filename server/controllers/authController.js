const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,99}$/;

const ALLOWED_ROLES = ['student', 'faculty', 'admin'];
const FACULTY_OPTIONS = ['Computing', 'Engineering', 'Business', 'Humanities'];
const COURSE_MAP = {
  Computing: ['Software Engineering', 'Computer Science', 'Cyber Security', 'Data Science'],
  Engineering: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
  Business: ['Business Administration', 'Accounting', 'Finance', 'Marketing'],
  Humanities: ['Psychology', 'English', 'International Relations'],
};
const ACADEMIC_YEAR_OPTIONS = ['1', '2', '3', '4'];

const sanitizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (email) => sanitizeText(email).toLowerCase();

const capitalizeName = (value) => {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split(/([-'])/)
        .map((part) =>
          part === '-' || part === "'"
            ? part
            : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('')
    )
    .join(' ');
};

const generateToken = (id, name, email, role, status, avatar = '', emailVerified = false) => {
  return jwt.sign(
    { id, name, email, role, status, avatar, emailVerified },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const validateRegisterInput = ({
  name,
  email,
  password,
  role,
  faculty,
  course,
  academicYear,
}) => {
  const cleanName = capitalizeName(name);
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = typeof password === 'string' ? password : '';
  const cleanRole = sanitizeText(role);
  const cleanFaculty = sanitizeText(faculty);
  const cleanCourse = sanitizeText(course);
  const cleanAcademicYear =
    academicYear !== undefined && academicYear !== null ? String(academicYear).trim() : '';

  if (!cleanName || !cleanEmail || !cleanPassword || !cleanRole) {
    return 'Please fill all required fields';
  }

  if (!NAME_REGEX.test(cleanName)) {
    return 'Please enter a valid full name';
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return 'Please enter a valid email address';
  }

  if (!ALLOWED_ROLES.includes(cleanRole)) {
    return 'Please select a valid role';
  }

  if (!PASSWORD_REGEX.test(cleanPassword)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }

  if (cleanRole !== 'admin') {
    if (!cleanFaculty) {
      return 'Faculty is required';
    }

    if (!FACULTY_OPTIONS.includes(cleanFaculty)) {
      return 'Please select a valid faculty';
    }
  }

  if (cleanRole === 'student') {
    if (!cleanCourse) {
      return 'Course is required for students';
    }

    if (!cleanAcademicYear) {
      return 'Academic year is required for students';
    }

    const validCourses = COURSE_MAP[cleanFaculty] || [];
    if (!validCourses.includes(cleanCourse)) {
      return 'Please select a valid course for the selected faculty';
    }

    if (!ACADEMIC_YEAR_OPTIONS.includes(cleanAcademicYear)) {
      return 'Please select a valid academic year';
    }
  }

  return null;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, faculty, course, academicYear } = req.body;

    const validationError = validateRegisterInput({
      name,
      email,
      password,
      role,
      faculty,
      course,
      academicYear,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanName = capitalizeName(name);
    const cleanEmail = normalizeEmail(email);
    const cleanRole = sanitizeText(role);
    const cleanFaculty = cleanRole === 'admin' ? '' : sanitizeText(faculty);
    const cleanCourse = cleanRole === 'student' ? sanitizeText(course) : '';
    const cleanAcademicYear = cleanRole === 'student' ? Number(String(academicYear).trim()) : null;

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      role: cleanRole,
      faculty: cleanFaculty,
      course: cleanCourse,
      academicYear: cleanAcademicYear,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await Notification.create({
      user: user._id,
      title: 'Welcome to UniHive',
      message: 'Your account was created successfully. Please verify your email.',
      type: 'success',
      read: false,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
      course: user.course,
      academicYear: user.academicYear,
      status: user.status,
      points: user.points,
      helperBadge: user.helperBadge,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      avatar: user.avatar || '',
      emailVerificationToken,
      token: generateToken(
        user._id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.avatar || '',
        user.emailVerified
      ),
    });
  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password.trim()) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
      course: user.course,
      academicYear: user.academicYear,
      status: user.status,
      points: user.points,
      helperBadge: user.helperBadge,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      avatar: user.avatar || '',
      token: generateToken(
        user._id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.avatar || '',
        user.emailVerified
      ),
    });
  } catch (error) {
    console.error('loginUser error:', error);
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1000 * 60 * 15);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Password Reset Requested',
      message: 'A password reset request was created for your account.',
      type: 'warning',
      read: false,
    });

    res.json({
      message: 'Password reset token generated successfully',
      resetToken,
      expiresAt: resetExpires,
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = sanitizeText(req.body.token);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, and a number',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Password Reset Successful',
      message: 'Your account password was updated successfully.',
      type: 'success',
      read: false,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = sanitizeText(req.body.token);

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = '';
    user.emailVerificationExpires = null;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Email Verified',
      message: 'Your email address has been verified successfully.',
      type: 'success',
      read: false,
    });

    res.json({
      message: 'Email verified successfully',
      emailVerified: true,
    });
  } catch (error) {
    console.error('verifyEmail error:', error);
    res.status(500).json({ message: error.message });
  }
};

const resendEmailVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Verification Token Regenerated',
      message: 'A new email verification token was generated for your account.',
      type: 'info',
      read: false,
    });

    res.json({
      message: 'Verification token generated successfully',
      emailVerificationToken,
      expiresAt: emailVerificationExpires,
    });
  } catch (error) {
    console.error('resendEmailVerification error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
};