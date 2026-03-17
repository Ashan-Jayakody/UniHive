const User = require('../models/User');

// GET LOGGED-IN USER PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('bookmarkedResources');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone ?? user.phone;
    user.profilePhoto = req.body.profilePhoto ?? user.profilePhoto;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      profilePhoto: updatedUser.profilePhoto,
      status: updatedUser.status,
      points: updatedUser.points,
      helperBadge: updatedUser.helperBadge,
      emailVerified: updatedUser.emailVerified,
      phoneVerified: updatedUser.phoneVerified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STUDENT BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      faculty,
      course,
      academicYear,
      status,
      points,
      helperBadge,
      profilePhoto,
      phone,
      emailVerified,
      phoneVerified,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.faculty = faculty ?? user.faculty;
    user.course = course ?? user.course;
    user.academicYear = academicYear ?? user.academicYear;
    user.status = status ?? user.status;
    user.points = points ?? user.points;
    user.helperBadge = helperBadge ?? user.helperBadge;
    user.profilePhoto = profilePhoto ?? user.profilePhoto;
    user.phone = phone ?? user.phone;
    user.emailVerified = emailVerified ?? user.emailVerified;
    user.phoneVerified = phoneVerified ?? user.phoneVerified;

    const updatedUser = await user.save();

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
        profilePhoto: updatedUser.profilePhoto,
        phone: updatedUser.phone,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE PHOTO
exports.updateProfilePhoto = async (req, res) => {
  try {
    const { profilePhoto } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePhoto = profilePhoto || user.profilePhoto;
    await user.save();

    res.json({
      message: 'Profile photo updated successfully',
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DEACTIVATE OWN ACCOUNT
exports.deactivateMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'deactivated';
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUSPEND USER (ADMIN)
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'suspended';
    await user.save();

    res.json({ message: 'User suspended successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BAN USER (ADMIN)
exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'banned';
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET LOGIN HISTORY (ADMIN)
exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email loginHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.loginHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.emailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY PHONE
exports.verifyPhone = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.phoneVerified = true;
    await user.save();

    res.json({ message: 'Phone verified successfully' });
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