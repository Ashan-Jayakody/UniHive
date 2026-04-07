const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['Registered', 'Attended', 'Cancelled'],
        default: 'Registered'
    }
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
