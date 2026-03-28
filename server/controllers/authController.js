const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const generateToken = (id, name, email, role, status, avatar = '', emailVerified = false) => {
  return jwt.sign(
    { id, name, email, role, status, avatar, emailVerified },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      faculty,
      course,
      academicYear,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      faculty: faculty || '',
      course: role === 'student' ? course || '' : '',
      academicYear: role === 'student' && academicYear ? Number(academicYear) : null,
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

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
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

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !token.trim()) {
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

// RESEND EMAIL VERIFICATION
exports.resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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