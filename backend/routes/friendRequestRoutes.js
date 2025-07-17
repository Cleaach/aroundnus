const express = require('express');
const router = express.Router();
const friendRequestController = require('../controllers/friendRequestController');
const authMiddleware = require('../middleware/authMiddleware');

// Send a friend request
router.post('/send', authMiddleware.verifyToken, friendRequestController.sendFriendRequest);
// Get received friend requests
router.get('/received', authMiddleware.verifyToken, friendRequestController.getReceivedFriendRequests);
// Get sent friend requests
router.get('/sent', authMiddleware.verifyToken, friendRequestController.getSentFriendRequests);
// Approve a friend request
router.post('/approve', authMiddleware.verifyToken, friendRequestController.approveFriendRequest);
// Reject a friend request
router.post('/reject', authMiddleware.verifyToken, friendRequestController.rejectFriendRequest);
// Search users by displayName
router.get('/search', authMiddleware.verifyToken, friendRequestController.searchUsersByDisplayName);
// Remove a friend
router.post('/remove-friend', authMiddleware.verifyToken, friendRequestController.removeFriend);

module.exports = router; 