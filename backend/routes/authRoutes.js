const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/init-user-doc', authController.verifyToken, authController.initUserDoc);

module.exports = router;