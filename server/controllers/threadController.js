const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const threadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      enum: ['General', 'Academics', 'Projects', 'Internships', 'Events'],
      default: 'General',
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Thread', threadSchema);