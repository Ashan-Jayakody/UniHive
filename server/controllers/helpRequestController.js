const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// create new help request
// POST/api/request/
const createHelpRequest = async (req, res) => {
    try{
        const {requesterId, topic, description, urgencyLevel, tags} = req.body;
        let attachmentUrl = null;
        if (req.file) {
            attachmentUrl = "https://cloud-storage.com/dummy-url.png"; 
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

        const updatedRequest = await HelpRequest.findOneAndUpdate(
            { _id: requestId, status: 'Open' },
            { 
                $set: { 
                    status: 'In Progress', 
                    acceptedHelper: helperId 
                } 
            },
            { new: true } 
        );

        if (!updatedRequest) {
            return res.status(409).json({ 
                success: false, 
                error: "This request has already been accepted or closed." 
            });
        }
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
            .populate('requester', 'name profilePicture')
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

// delete a help request
// DELETE/api/request/:id

    

module.exports = {
    createHelpRequest,inviteExperts,acceptHelpRequest,addMessage, 
    resolveHelpRequest, getOpenRequests, getMyInvitations, getMyRequests
};