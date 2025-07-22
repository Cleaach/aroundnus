const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    shareLocation,
    getSharedLocations,
    removeSharedLocation
} = require('../controllers/sharedLocationController');

router.post('/share', authMiddleware.verifyToken, shareLocation);
router.get('/:friendUid', authMiddleware.verifyToken, getSharedLocations);
router.delete('/', authMiddleware.verifyToken, removeSharedLocation);

module.exports = router;
