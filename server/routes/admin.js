const router = require("express").Router();
const Booking = require("../models/Booking");
const User = require("../models/User");

// GET ALL BOOKINGS (Admin)
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("customerId hostId listingId");
    res.status(200).json(bookings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch bookings", error: err.message });
  }
});

// GET BOOKING BY ID (Admin)
router.get("/bookings/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId).populate("customerId hostId listingId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }
    res.status(200).json(booking);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch booking", error: err.message });
  }
});

// DELETE BOOKING (Admin)
router.delete("/bookings/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }
    res.status(204).send(); // Successful deletion
  } catch (err) {
    res.status(500).json({ message: "Failed to delete booking", error: err.message });
  }
});

// GET ALL USERS (Admin)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// DELETE USER (Admin)
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
});

// PATCH - UPDATE USER ROLE (Admin)
router.patch("/users/:userId/role", async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || (role !== "user" && role !== "admin")) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();
    res.status(200).json({ message: "User role updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
});

// GET route to fetch users with at least one listing
router.get("/users-with-listings", async (req, res) => {
  try {
    const usersWithListings = await User.aggregate([
      {
        $lookup: {
          from: "listings", // Name of the listings collection
          localField: "_id", // Field in the user collection
          foreignField: "creator", // Field in the listing collection
          as: "listings", // Output array field
        },
      },
      {
        $match: {
          "listings.0": { $exists: true }, // Match users with at least one listing
        },
      },
      {
        $project: {
          _id:1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          listingCount: { $size: "$listings" },
          listingTitles: "$listings.title", // Include the count of listings
        },
      },
    ]);

    res.status(200).json(usersWithListings); // Return the list as JSON
  } catch (error) {
    console.error("Error fetching users with listings:", error);
    res.status(500).json({ error: "An error occurred while fetching users with listings." });
  }
});
/* GET hosts property list */
router.get("/:userId/propertylistings", async (req, res) => {
  try {
    const { userId } = req.params;
    const properties = await Listing.find({ creator: userId }).populate("creator");
    res.status(202).json(properties);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Cannot find properties!", error: err.message });
  }
});

module.exports = router;
