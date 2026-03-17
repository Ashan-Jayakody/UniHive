const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      faculty,
      course,
      academicYear,
      phone,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      faculty,
      course,
      academicYear,
      phone: phone || '',
      status: 'active',
      points: 0,
      helperBadge: false,
      profilePhoto: '',
      emailVerified: false,
      phoneVerified: false,
      loginHistory: [],
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
      profilePhoto: user.profilePhoto,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.loginHistory.push({
      loginAt: new Date(),
      device: req.headers['user-agent'] || 'Unknown device',
      ipAddress: req.ip || '',
    });

    await user.save();

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
      profilePhoto: user.profilePhoto,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};