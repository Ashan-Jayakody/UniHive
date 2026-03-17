const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    faculty: {
      type: String,
      default: '',
    },
    course: {
      type: String,
      default: '',
    },
    academicYear: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'deactivated', 'suspended', 'banned'],
      default: 'active',
    },
    points: {
      type: Number,
      default: 0,
    },
    helperBadge: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    loginHistory: [
      {
        loginAt: { type: Date, default: Date.now },
        device: { type: String, default: 'Unknown device' },
        ipAddress: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);