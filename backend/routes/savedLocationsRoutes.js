const express = require("express");
const router = express.Router();
const savedLocationsController = require("../controllers/savedLocationsController");

router.get('/get', savedLocationsController.getSavedLocations);
router.post('/add', savedLocationsController.addSavedLocation);
router.delete('/delete', savedLocationsController.deleteSavedLocation);

module.exports = router;

