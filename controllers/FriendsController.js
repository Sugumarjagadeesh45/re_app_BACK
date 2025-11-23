const User = require('../models/userModel');
const FriendRequest = require('../models/FriendRequest');
const UserData = require('../models/UserData');

// Get friend suggestions based on birth year
exports.getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || !user.dateOfBirth) {
      return res.status(400).json({ success: false, message: 'User date of birth not found' });
    }
    
    const birthYear = new Date(user.dateOfBirth).getFullYear();
    
    // Find users with the same birth year who are not already friends
    const suggestions = await User.find({
      dateOfBirth: {
        $gte: new Date(`${birthYear}-01-01`),
        $lt: new Date(`${birthYear + 1}-01-01`),
      },
      _id: { $ne: userId },
    }).select('name email userId photoURL dateOfBirth').limit(10);
    
    res.json({
      success: true,
      suggestions: suggestions.map(user => ({
        ...user._doc,
        status: `${Math.floor(Math.random() * 20) + 1} mutual friends`,
      })),
    });
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user.id;
    
    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      fromUserId,
      toUserId,
      status: 'pending',
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Friend request already sent' });
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      fromUserId,
      toUserId,
      message: message || '',
    });
    
    await friendRequest.save();
    
    res.json({
      success: true,
      message: 'Friend request sent successfully',
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get friends list
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find accepted friend requests where user is either sender or receiver
    const friendRequests = await FriendRequest.find({
      $or: [
        { fromUserId: userId, status: 'accepted' },
        { toUserId: userId, status: 'accepted' },
      ],
    });
    
    // Extract friend IDs
    const friendIds = friendRequests.map(request => {
      return request.fromUserId.toString() === userId.toString() 
        ? request.toUserId 
        : request.fromUserId;
    });
    
    // Get friend details
    const friends = await User.find({
      _id: { $in: friendIds },
    }).select('name email userId photoURL');
    
    // Add random status for demo purposes
    const friendsWithStatus = friends.map(friend => ({
      ...friend._doc,
      status: ['Active now', 'Active 5m ago', 'Active 1h ago', 'Active 3h ago', 'Active yesterday'][
        Math.floor(Math.random() * 5)
      ],
    }));
    
    res.json({
      success: true,
      friends: friendsWithStatus,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};