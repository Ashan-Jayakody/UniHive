// server/models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Notes', 'Videos', 'Research Papers', 'Links'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 120,
    },
    module: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, subject: 1, module: 1, approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);