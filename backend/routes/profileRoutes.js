const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const profilePictureController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

router.post('/update-profile-picture', authMiddleware.verifyToken, upload.single('profilePicture'), profilePictureController.updateProfilePicture);
router.post('/update-displayname', authMiddleware.verifyToken, profilePictureController.updateDisplayName);
router.get('/get-profile-data', authMiddleware.verifyToken, profilePictureController.getProfileData);
router.get('/get-profile-data-by-uid', authMiddleware.verifyToken, profilePictureController.getProfileDataByUid);

module.exports = router;