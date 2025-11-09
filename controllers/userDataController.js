const UserData = require('../models/UserData');
const User = require('../models/userModel');

// Get user profile data - Enhanced with better logging
const getUserProfile = async (req, res) => {
  try {
    console.log('Get user profile request for userId:', req.user.id);

    const userData = await UserData.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone dateOfBirth gender photoURL registrationComplete userId');
    
    console.log('Found userData:', userData);

    if (!userData) {
      // Create initial user data if doesn't exist
      console.log('No userData found, creating new one...');
      const newUserData = new UserData({
        userId: req.user.id
      });
      await newUserData.save();
      
      const populatedData = await UserData.findById(newUserData._id)
        .populate('userId', 'name email phone dateOfBirth gender photoURL registrationComplete userId');
      
      console.log('Created new userData:', populatedData);
      
      return res.json({
        success: true,
        user: populatedData.userId,
        userData: populatedData
      });
    }

    console.log('Returning existing userData:', {
      user: userData.userId,
      userData: userData
    });

    res.json({
      success: true,
      user: userData.userId,
      userData: userData
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      bio,
      location,
      website,
      socialLinks,
      interests,
      preferences
    } = req.body;

    // Update basic user info
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (dateOfBirth) userUpdate.dateOfBirth = dateOfBirth;
    if (gender) userUpdate.gender = gender;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user.id, userUpdate);
    }

    // Update or create user data
    const userDataUpdate = {};
    if (bio !== undefined) userDataUpdate.bio = bio;
    if (location !== undefined) userDataUpdate.location = location;
    if (website !== undefined) userDataUpdate.website = website;
    if (socialLinks) userDataUpdate.socialLinks = socialLinks;
    if (interests) userDataUpdate.interests = interests;
    if (preferences) userDataUpdate.preferences = preferences;

    const userData = await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $set: userDataUpdate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email phone dateOfBirth gender photoURL registrationComplete userId');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData.userId,
      userData: userData
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ success: false, message: 'Profile picture is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
  req.user.id, 
  { photoURL: profilePicture },
  { new: true, select: 'name email phone dateOfBirth gender photoURL registrationComplete userId' }
);

    // Update userData profilePicture
    const userData = await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { profilePicture: profilePicture } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('userId', 'name email phone dateOfBirth gender photoURL registrationComplete userId');

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      user: updatedUser, // Use the updated user object
      userData: userData
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// Get user stats
const getUserStats = async (req, res) => {
  try {
    const userData = await UserData.findOne({ userId: req.user.id })
      .select('stats profileCompletion');
    
    if (!userData) {
      return res.json({
        success: true,
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          likesCount: 0
        },
        profileCompletion: 0
      });
    }

    res.json({
      success: true,
      stats: userData.stats,
      profileCompletion: userData.profileCompletion
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id } // Exclude current user
    }).select('name email photoURL').limit(20);

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getUserStats,
  searchUsers
};