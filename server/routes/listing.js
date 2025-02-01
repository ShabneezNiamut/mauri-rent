const router = require("express").Router();
const multer = require("multer");
const Listing = require("../models/Listing");
const User = require("../models/User");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    const prefix = file.fieldname === 'propertyProof' ? 'proof-' : 'img-'; // Use 'proof-' prefix for property proof document
    cb(null, prefix + Date.now() + '-' + file.originalname); // Use the original file name with prefix and timestamp
  },
});

const upload = multer({ storage });

/* Multer middleware for handling different types of file fields */
const uploadFields = upload.fields([
  { name: 'listingPhotos', maxCount: 10 },
  { name: 'propertyProof', maxCount: 1 }
]);

/* CREATE LISTING */
router.post("/create", uploadFields, async (req, res) => {
  try {
    const {
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    } = req.body;

    const listingPhotos = req.files['listingPhotos'] ? req.files['listingPhotos'].map(file => file.filename) : [];
    const propertyProof = req.files['propertyProof'] ? `uploads/${req.files['propertyProof'][0].filename}` : null;


    // Adjust the propertyProofPath to only store the relative path from the 'public/uploads' directory
    const newListing = new Listing({
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      listingPhotoPaths: listingPhotos, // Already storing only the filename
      propertyProofPath: `uploads/${propertyProof}`, // Storing it as uploads/filename
      title,
      description,
      highlight,
      highlightDesc,
      price,
    });

    await newListing.save();

    res.status(200).json(newListing);
  } catch (err) {
    res.status(409).json({ message: "Failed to create listing", error: err.message });
    console.log(err);
  }
});

/* GET LISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;

  try {
    let listings;
    if (qCategory) {
      // Fetch listings by category and filter by isApproved
      listings = await Listing.find({ category: qCategory, isApproved: true }).populate("creator");
    } else {
      // Fetch all listings and filter by isApproved
      listings = await Listing.find({ isApproved: true }).populate("creator");
    }

    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch listings", error: err.message });
    console.log(err);
  }
});

/* GET LISTINGS BY SEARCH */
router.get("/search/:search", async (req, res) => {
  const { search } = req.params;

  try {
    let listings = [];

    if (search === "all") {
      listings = await Listing.find().populate("creator");
    } else {
      // Use $or to match search terms with any of these fields
      listings = await Listing.find({
        $or: [
          // Search for city, province, country, etc.
          { city: { $regex: search, $options: "i" } },
          { province: { $regex: search, $options: "i" } },
          { country: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
          { streetAddress: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          // Add the query to search by creator's (host's) first or last name
          {
            "creator.firstName": { $regex: search, $options: "i" }
          },
          {
            "creator.lastName": { $regex: search, $options: "i" }
          }
        ],
      }).populate("creator");

      if (listings.length === 0) {
        return res.status(404).json({ message: "No listings found for this search." });
      }
    }

    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch listings", error: err.message });
    console.log(err);
  }
});

/* LISTING DETAILS */
router.get("/properties/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId).populate("creator");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found!" });
    }
    res.status(200).json(listing); 
  } catch (err) {
    res.status(404).json({ message: "Listing not found!", error: err.message });
  }
});

/* DELETE LISTING */
router.delete("/:listingId", async (req, res) => {
  const { listingId } = req.params;

  try {
    const deletedListing = await Listing.findByIdAndDelete(listingId);

    if (!deletedListing) {
      return res.status(404).json({ message: "Listing not found!" });
    }

    // Optionally: Delete associated images from the filesystem
    // Here, you can include logic to delete the images from your storage if needed

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listing", error: err.message });
    console.log(err);
  }
});

// GET unapproved listings
router.get("/unapproved", async (req, res) => {
  try {
    const listings = await Listing.find({ isApproved: false }).populate("creator");
    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Failed to fetch unapproved listings", error: err.message });
  }
});

// Update listing approval status
router.post('/approve/:listingId', async (req, res) => {
  const { listingId } = req.params;
  try {
    const updatedListing = await Listing.findByIdAndUpdate(listingId, { isApproved: true }, { new: true });
    res.status(200).json(updatedListing);
  } catch (err) {
    res.status(500).json({ message: "Failed to approve listing", error: err.message });
  }
});


module.exports = router;
