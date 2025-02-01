// services/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();  // Load environment variables

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,  // Use STARTTLS port 587
    secure: false,  // Don't use SSL initially
    tls: {
      rejectUnauthorized: false,  // Disable certificate verification for local testing
    },
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
   

const sendEmailToUser = async (userEmail, reply) => {
  const mailOptions = {
    from: "support@maurirent.com",  // Your support email (fake for testing)
    to: userEmail,
    subject: "Response to Your Support Message",
    text: `Dear User,\n\nWe have replied to your support message:\n\n${reply}\n\nBest regards,\nSupport Team`,
  };

  // Log the mail options to see what is being sent
  console.log('Sending email with the following details:');
  console.log('To:', userEmail);
  console.log('Subject:', mailOptions.subject);
  console.log('Body:', mailOptions.text);

  try {
    // Log before sending email to check if it's triggered
    console.log('Attempting to send email...');

    // Sending email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", userEmail);
  } catch (error) {
    // Log the error if sending fails
    console.error("Error sending email:", error);
  }
};

// send notif to admin after a new customer support message has been received
const sendEmailToAdmin = async (adminEmail, userName) => {
  const mailOptions = {
    from: "support@maurirent.com", // Sender email (fake for testing)
    to: adminEmail,
    subject: "New Customer Support Message",
    text: `You have received a new customer support message from ${userName}. Please check the admin dashboard for more details.`,
  };

  console.log('Sending email to admin with the following details:');
  console.log('To:', adminEmail);
  console.log('Subject:', mailOptions.subject);
  console.log('Body:', mailOptions.text);

  try {
    console.log('Attempting to send email to admin...');
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", adminEmail);
    console.log("Mail info:", info); // Log the mail info to verify
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmailToUser, sendEmailToAdmin };
