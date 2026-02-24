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

        if (req.body.password) {
            user.password = req.body.password; // will auto-hash because of pre-save hook
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// get student by ID
exports.getUserById = async(req, res) =>{
    try{
        const user = await User.findById(req.params.id).select('-password');

        if(!user) {
            return res.status(404).json({message: 'User not found'});
        }
        if(user.role !== 'student'){
            return res.status(404).json({message: 'Student not found'});
        }
        res.status(200).json(user);
    } catch (error) {
        if(error.kind === 'ObjectId') {
            return res.status(404).json({message: "User not found"});
        }
        res.status(500).json({ message: error.message });
    }
};


// ADMIN: GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
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