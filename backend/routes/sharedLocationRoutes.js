const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    shareLocation,
    getSharedLocations,
    removeSharedLocation
} = require('../controllers/sharedLocationController');

// Share a location with friends
router.post('/share', authMiddleware.verifyToken, shareLocation);

// Get locations shared with the current user
router.get('/', authMiddleware.verifyToken, getSharedLocations);


// Remove a shared location
router.delete('/', authMiddleware.verifyToken, removeSharedLocation);

module.exports = router;
