const express = require("express");
const { submitMessage, getContactMessages, handleAdminReply } = require("../controllers/contactController");

const router = express.Router();

// Route for submitting support messages
router.post("/contact-support", submitMessage);

// Route for fetching all contact support messages (for admin)
router.get("/contact-support", getContactMessages);

// Route for handling admin reply
router.patch("/contact-support/reply", handleAdminReply);

module.exports = router;

