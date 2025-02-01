const mongoose = require("mongoose");

const contactSupportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],      
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    reply: {  // Added this field to store the admin's reply
      type: String,
      required: false,  // Not required initially, as the reply will come after the admin action
    },
  },
  { timestamps: true }
);

const ContactSupport = mongoose.model("ContactSupport", contactSupportSchema);
module.exports = ContactSupport;
