const mongoose = require('mongoose');

const sessionFeedbackSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Prevent duplicate feedback from the same student for the same session
sessionFeedbackSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('SessionFeedback', sessionFeedbackSchema);
