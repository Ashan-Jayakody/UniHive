const { timestamp } = require('drizzle-orm/gel-core');
const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
    requester:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    urgencyLevel: {
        type: String,
        enum: ['Low', 'Medium', 'Critical'],
        default: 'Medium'
    },
    attachmentUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    tags: [{
        type: String
    }],
    askedExperts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    acceptedHelper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    summary: {
        type: String
    },
    publishSummary: {
        type: Boolean,
        default: false
    },
    // this will use for direct chat and Q&A board
    discussion: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    totalHelped: {
        type: Number,
        default: 0
    }
},{ timestamps: true});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);