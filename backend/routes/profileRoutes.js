const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const profilePictureController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

router.post('/update', authMiddleware.verifyToken, upload.single('profilePicture'), profilePictureController.updateProfilePicture);
router.get('/data', authMiddleware.verifyToken, profilePictureController.getProfileData);

module.exports = router;