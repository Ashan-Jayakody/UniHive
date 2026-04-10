const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// create new help request
// POST/api/request/
const createHelpRequest = async (req, res) => {
    try{
        const {requesterId, topic, description, urgencyLevel, tags} = req.body;
        let attachmentUrl = null;
        if (req.file) {
            attachmentUrl = `/uploads/${req.file.filename}`; 
        }

        const parsedTags =
  typeof tags === 'string'
    ? tags.split(',').map(tag => tag.trim().toLowerCase())
    : tags.map(tag => tag.toLowerCase());

        const newRequest = await HelpRequest.create({
            requester: req.user._id,
            topic,
            description,
            urgencyLevel,
            attachmentUrl,
            tags: parsedTags,
            attachment: attachmentUrl,
            status: 'Open'
        });

        const suggestedHelpers = await User.find({
            _id: {$ne: req.user._id},
            expertiseAreas: {$in: parsedTags}
        }).sort({rating:-1}).limit(3).select('name expertiseAreas rating');

        res.status(201).json({
            success: true,
            helpRequest: newRequest,
            helpers: suggestedHelpers
        });

    }catch (error) {
        res.status(500).json({error: "Failed to create help request",
             details: error.message});
    }
};

// invite experts
// PUT/api/:id/invite
const inviteExperts = async(req, res) => {
    try{
        const requestId = req.params.id;
        const {expertIds} = req.body;

        const helpRequest = await HelpRequest.findById(requestId);

        if(!helpRequest) {
            return res.status(404).json({error: "help request not found"});
        }

        if(helpRequest.status !== 'Open') {
            return res.status(404).json({error: "Cannot invite to a closed request"});
        }

        //add new experts and returns updated doc
        const updatedRequest = await HelpRequest.findByIdAndUpdate(
            requestId,
            {$addToSet: {askedExperts: {$each: expertIds}}},
            {new: true}
        );
        res.status(200).json({
            success: true,
            message: "Successfully invited",
            helpRequest: updatedRequest
        });

    }catch(error) {
        console.error("Invite Error:", error);
        res.status(500).json({error: "Failed to Invite Experts", details: error.message});
    }
};


// accept help request
// PUT/api/request/:id/accept
const acceptHelpRequest = async(req, res) => {
    try {
        const requestId = req.params.id;
        const helperId = req.user._id;

        const request = await HelpRequest.findById(requestId).select('requester status');

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Help request not found."
            });
        }

        if (request.requester.toString() === helperId.toString()) {
            return res.status(403).json({
                success: false,
                error: "You cannot offer help on your own request."
            });
        }

        if (request.status !== 'Open') {
            return res.status(409).json({
                success: false,
                error: "This request has already been accepted or closed."
            });
        }

        request.status = 'In Progress';
        request.acceptedHelper = helperId;
        const updatedRequest = await request.save();

        res.status(200).json({
            success: true,
            message: "You are now helping with this request!",
            helpRequest: updatedRequest
        });

    } catch (error) {
        console.error("Accept Error:", error);
        res.status(500).json({ error: "Failed to accept request", details: error.message });
    }
};


// chat functionality
// POST/api/request/:id/message
const addMessage = async (req, res) => {
    try{
        const requestId = req.params.id;
        const {message} = req.body;
        const senderId = req.user._id;

        if(!message) {
            return res.status(400).json({error: "Message text is required"});
        }

        //message object
        const newMessage = {
            sender: senderId,
            message: message
        };

        const updatedRequest = await HelpRequest.findByIdAndUpdate(
            requestId,
            {$push: {discussion: newMessage}},
            {new: true}
        ).populate('discussion.sender', 'name profilePicture');

        if(!updatedRequest) {
            return res.status(404).json({error: "Help request not found"});
        }

        const saved = updatedRequest.discussion.at(-1); // Get the last message 

        //broadcast to everyone in the room 
        req.io.to(`request-${requestId}`).emit("receive_message", {
            _id: saved._id,
            sender: saved.sender,
            message: saved.message,
            createdAt: saved.createdAt
        });

        res.status(200).json({
            success: true,
            message: "Message saved successfully",
            discussion: updatedRequest.discussion
        });
    }catch (error){
        console.error("Message error:", error);
        res.status(500).json({ error: "Failed to save message", details: error.message });
    }
};


// resolve request
// PUT/api/request/:id/resolve
const resolveHelpRequest = async(req, res) => {
    try {
        const requestId = req.params.id;
        const { summary, rating } = req.body;
        const requesterId = req.user._id;

        const helpRequest = await HelpRequest.findById(requestId);
        if (!helpRequest) {
            return res.status(404).json({ error: "Help request not found" });
        }

        if (helpRequest.requester.toString() !== requesterId.toString()) {
            return res.status(403).json({ error: "Only the original author can resolve this issue." });
        }

        if (helpRequest.status === 'Resolved') {
            return res.status(400).json({ error: "This request is already resolved." });
        }

        helpRequest.status = 'Resolved';
        helpRequest.summary = summary;
        helpRequest.rating = rating;
        
        const updatedRequest = await helpRequest.save();

        if (helpRequest.acceptedHelper) {
            await User.findByIdAndUpdate(
                helpRequest.acceptedHelper,
                { $inc: { reputationPoints: rating } } 
            );
        }

        res.status(200).json({
            success: true,
            message: "Request resolved and helper rewarded!",
            helpRequest: updatedRequest
        });

    } catch (error) {
        console.error("RESOLVE ERROR:", error);
        res.status(500).json({ error: "Failed to resolve request", details: error.message });
    }
};


//get open requests for the public board
// GET/api/request
const getOpenRequests = async(req, res) => {
    try {
        const requests = await HelpRequest.find({status: 'Open'})
            .populate('requester', 'name faculty academicYear')
            .sort({createdAt: -1})
        
        res.status(200).json({success: true, requests });
    } catch (error) {
        console.error("Get open requests error:", error);
        res.status(500).json({ error: "Failed to fetch open requests", details: error.message });
    }
}

// get open requests where the user was specifically invited
// GET/api/request/invitations
const getMyInvitations = async(req, res) => {
    try {
        const invitations = await HelpRequest.find({
            status: 'Open',
            askedExperts: req.user._id  //looks their id in the array
        }).populate('requester', 'name')
        .populate('urgencyLevel')
        .sort({createdAt: -1});

        res.status(200).json({success: true, invitations});
    }catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({ error: "Failed to fetch invitations", details: error.message });
    }
};


// get all help requests created by the user
// GET/api/request/myrequests
const getMyRequests = async(req, res) => {
    try{
        const myRequests = await HelpRequest.find({requester: req.user._id})
        .populate('acceptedHelper', 'name email')
        .sort({createdAt: -1});

        res.status(200).json({success: true, myRequests});
    }catch (error) {
        console.error("Get my requests error:", error);
        res.status(500).json({error: "Failed to fetch your requests"});
    }
};

//Get a single help request by ID (for the chat room)
// GET /api/request/:id
const getSingleRequest = async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id)
            .populate('requester', 'name')
            .populate('acceptedHelper', 'name');

        // If the ID doesn't exist in the database, tell the frontend
        if (!helpRequest) {
            return res.status(404).json({ error: "Request not found in database" });
        }

        res.status(200).json({ success: true, helpRequest });
    } catch (error) {
        console.error("GET SINGLE REQUEST ERROR:", error);
        res.status(500).json({ error: "Server error fetching request details" });
    }
};

//Get requests the user has accepted to help with
//GET /api/request/mytasks
const getMyTasks = async (req, res) => {
    try {
        const tasks = await HelpRequest.find({ 
            acceptedHelper: req.user._id, 
            status: 'In Progress' 
        }).populate('requester', 'name');

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
};

//
const getMessages = async (req, res) => {
    try {
        const request = await HelpRequest.findById(req.params.id)
            .populate('discussion.sender', 'name profilePicture');

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }
        res.status(200).json({ 
            success: true, 
            discussion: request.discussion ,
            topic: request.topic
        });
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ error: "Failed to fetch messages", details: error.message });
    }
};

// delete a help request
// DELETE/api/request/:id

    

module.exports = {
    createHelpRequest,inviteExperts,acceptHelpRequest,addMessage, 
    resolveHelpRequest, getOpenRequests, getMyInvitations, getMyRequests, 
    getSingleRequest, getMyTasks, getMessages
};