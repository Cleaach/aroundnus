const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post('/verify-token', authMiddleware.verifyToken);

module.exports = router;