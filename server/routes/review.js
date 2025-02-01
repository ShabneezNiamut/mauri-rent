const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Booking = require("../models/Booking"); 

// Add a new review
router.post("/", async (req, res) => {
  try {
    const { userId, listingId, comment, stars } = req.body;

    // Validate the input data
    if (!userId || !listingId || !comment || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Check if the user has a confirmed booking for the given listingId
    const booking = await Booking.findOne({
      customerId: userId, // Check if this user has booked this property
      listingId: listingId, // Ensure the booking is for the correct listing
      status: "pending",  // Ensure the booking is confirmed
    });    

    // Check if the user has already submitted a review for this property
    const existingReview = await Review.findOne({ userId, listingId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this property" });
    }

    // Create and save the new review
    const review = new Review({
      userId,
      listingId,
      comment,
      stars,
    });

    await review.save();
    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Failed to Submit review", error: error.message });
  }
});


// Get all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "firstName lastName")  // Populate with 'firstName' and 'lastName'
      .populate("listingId", "title")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);  // Log the error in more detail
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});

// Get average rating for each property
router.get("/average-per-property", async (req, res) => {
  try {
    // Aggregate reviews to calculate average for each property
    const result = await Review.aggregate([
      {
        $group: {
          _id: "$listingId",  // Group by propertyId
          averageRating: { $avg: "$stars" },  // Calculate average stars
          count: { $sum: 1 }  // Count reviews for each property
        }
      },
      {
        $lookup: {
          from: "listings",  // Lookup the properties collection
          localField: "_id",
          foreignField: "_id",
          as: "property"  // Join the property details
        }
      },
      { $unwind: "$property" },  // Unwind the joined property
      {
        $project: {
          listingId: "$_id",
          title: "$property.title",  // Get property title
          averageRating: { $round: ["$averageRating", 1] },  // Round the average rating to 1 decimal
          reviewCount: "$count"  // Include the review count
        }
      }
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching average rating per property:", error);
    res.status(500).json({ message: "Failed to fetch average rating per property", error: error.message });
  }
});

// Get all reviews for admin
router.get("/", async (req, res) => {
  try {
    // Fetch all reviews and populate userId and listingId
    const reviews = await Review.find()
      .populate("userId", "firstName lastName")  // Populate userId with firstName and lastName
      .populate("listingId", "title")  // Populate listingId with title of the property
      .sort({ createdAt: -1 });  // Sort by the newest reviews first

    // If no reviews are found
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    // Return reviews with populated user and listing details
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});


//delete review for admin 
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;  // Get listingId from URL parameters
    console.log("Fetching reviews for listingId:", listingId); // Log the listingId

    const reviews = await Review.find({ listingId })
      .populate("userId", "firstName lastName")
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    console.log("Fetched reviews:", reviews); // Log the fetched reviews

    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found for this listing." });
    }

    res.json(reviews); // Return reviews as a JSON response
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});

module.exports = router;
