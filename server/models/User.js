const mongoose = require('mongoose');
const faculties = require('../config/faculties');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
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
    reputationPoints: {
        type: Number,
        default: 0
    },
    bookmarkedResources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }]
}, { timestamps: true }); 

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});

//compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);