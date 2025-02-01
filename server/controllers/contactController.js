// contactController.js
const ContactSupport = require("../models/ContactSupport");
const { sendEmailToUser, sendEmailToAdmin } = require("../services/emailService");  // Import the email function

// Submit a support message
const submitMessage = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const newMessage = new ContactSupport({
      name,
      email,
      message,
    });

    // Save the message first
    await newMessage.save();
    console.log('Message saved successfully:', newMessage);

    // Send email notification to the admin with the user's name
    await sendEmailToAdmin("admin@maurirent.com", name);  // Admin email and user's name

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error submitting message:", error);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};


// Fetch all contact support messages (for admin)
const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactSupport.find(); // Fetch all messages
    res.status(200).json(messages); // Return the messages as JSON
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};

// Handle admin reply to the user
const handleAdminReply = async (req, res) => {
  const { messageId, adminReply } = req.body;

  try {
    const message = await ContactSupport.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Send an email reply to the user
    await sendEmailToUser(message.email, adminReply);

    // Update the message status to 'resolved'
    message.status = "resolved";
    await message.save();

    res.status(200).json({ message: "Reply sent and message status updated." });
  } catch (error) {
    console.error("Error handling reply:", error);
    res.status(500).json({ message: "Error processing reply." });
  }
};

module.exports = { submitMessage, getContactMessages, handleAdminReply };
