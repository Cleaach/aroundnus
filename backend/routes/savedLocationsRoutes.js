const express = require("express");
const router = express.Router();
const savedLocationsController = require("../controllers/savedLocationsController");

router.get('/', savedLocationsController.getSavedLocations);
router.post('/', savedLocationsController.addSavedLocation);
router.delete('/:id', savedLocationsController.deleteSavedLocation);

module.exports = router;

