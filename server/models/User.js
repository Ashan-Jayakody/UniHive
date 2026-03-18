const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
<<<<<<< HEAD
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'], // Restricts to these exact roles
        default: 'student'
    },
    faculty: {
        type: String,
        required: true,
        enum: Object.keys(faculties)
    },
    course: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return faculties[this.faculty]?.includes(value);
            },
            message: 'Invalid course for selected faculty'
        }
    },
    academicYear: {
        type: Number,
        enum: [1,2,3,4],
        required: true
    },
    expertSkills: [{
        type: String
    }],
    reputationPoints: {
        type: Number,
        default: 0
    },
    bookmarkedResources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }]
}, { timestamps: true }); 
=======
>>>>>>> 0a87fa93a85c9be78a169cb64caa4eb496f10bd8

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