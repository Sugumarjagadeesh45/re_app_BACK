const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');
const protect = require('../middleware/auth');

// All routes are protected
router.get('/profile', protect, userDataController.getUserProfile);
router.put('/profile', protect, userDataController.updateUserProfile);
router.post('/profile-picture', protect, userDataController.uploadProfilePicture);
router.get('/stats', protect, userDataController.getUserStats);
router.get('/search', protect, userDataController.searchUsers);

module.exports = router;