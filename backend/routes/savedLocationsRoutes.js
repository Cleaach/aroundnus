const express = require("express");
const router = express.Router();
const savedLocationsController = require("../controllers/savedLocationsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get('/get', authMiddleware.verifyToken, savedLocationsController.getSavedLocations);
router.post('/add', authMiddleware.verifyToken, savedLocationsController.addSavedLocation);
router.delete('/delete', authMiddleware.verifyToken, savedLocationsController.deleteSavedLocation);

module.exports = router;