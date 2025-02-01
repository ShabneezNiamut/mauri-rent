const router = require("express").Router();
const Booking = require("../models/Booking");
const User = require("../models/User");
const Listing = require("../models/Listing");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" }); // Specify the upload destination

/* GET TRIP LIST */
router.get("/:userId/trips", async (req, res) => {
  try {
    const { userId } = req.params;
    const trips = await Booking.find({ customerId: userId }).populate("customerId hostId listingId");
    res.status(200).json(trips);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Cannot find trips!", error: err.message });
  }
});

/* ADD LISTING TO WISHLIST */
router.patch("/:userId/:listingId", async (req, res) => {
  try {
    const { userId, listingId } = req.params;
    const user = await User.findById(userId);
    const listing = await Listing.findById(listingId).populate("creator");

    const favoriteListing = user.wishList.find((item) => item._id.toString() === listingId);

    if (favoriteListing) {
      user.wishList = user.wishList.filter((item) => item._id.toString() !== listingId);
      await user.save();
      res.status(200).json({ message: "Listing is removed from wish list", wishList: user.wishList });
    } else {
      user.wishList.push(listing);
      await user.save();
      res.status(200).json({ message: "Listing is added to wish list", wishList: user.wishList });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ error: err.message });
  }
});

/* GET PROPERTY LIST */
router.get("/:userId/properties", async (req, res) => {
  try {
    const { userId } = req.params;
    // Fetch only approved properties for the specific user
    const properties = await Listing.find({ creator: userId, isApproved: true }).populate("creator");
    res.status(202).json(properties);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Cannot find properties!", error: err.message });
  }
});

/* GET RESERVATION LIST */
router.get("/:userId/reservations", async (req, res) => {
  try {
    const { userId } = req.params;
    const reservations = await Booking.find({ hostId: userId }).populate("customerId hostId listingId");
    res.status(202).json(reservations);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Cannot find reservations!", error: err.message });
  }
});

/* GET USER DETAILS */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    
    // Include email in the response
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      profileImagePath: user.profileImagePath,
      email: user.email, // Add this line to include the email
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* UPDATE USER DETAILS */
router.put("/:userId", upload.single("profileImage"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email } = req.body;

    const updateData = {
      firstName,
      lastName,
      email,
    };

    // If a new profile image is uploaded
    if (req.file) {
      updateData.profileImagePath = req.file.path; // Adjust the path as needed
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImagePath: user.profileImagePath,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* HANDLE ACCOUNT DELETION REQUEST */
router.post("/:userId/request-deletion", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Set the requestDelete flag to true
    user.requestDelete = true;
    await user.save();

    res.status(200).json({ message: "Account deletion request submitted." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error processing deletion request", error: err.message });
  }
});

module.exports = router;
