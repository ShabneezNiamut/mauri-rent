const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    listingId: {  // Rename propertyId to listingId
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing", // Reference to the Listing model
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt fields automatically 
    unique: true, // Ensures that each user can only review a property once
    indexes: [
      { fields: { userId: 1, listingId: 1 }, unique: true } // Create a compound index for unique user-property pairs
    ]
  }
);

module.exports = mongoose.model("Review", ReviewSchema);
