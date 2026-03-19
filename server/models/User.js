const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: [true, 'Role is required'],
      default: 'student',
    },

    faculty: {
      type: String,
      default: '',
      trim: true,
    },

    course: {
      type: String,
      default: '',
      trim: true,
    },

    academicYear: {
      type: Number,
      default: null,
    },

    expertiseAreas: [
      {
        type: String,
        trim: true,
      },
    ],
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

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: '',
    },

    savedThreads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
      },
    ],

    resetPasswordToken: {
      type: String,
      default: '',
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);