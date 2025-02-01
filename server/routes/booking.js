const router = require("express").Router();
const Booking = require("../models/Booking");

/* CREATE BOOKING */
router.post("/create", async (req, res) => {
  const { customerId, hostId, listingId, startDate, endDate, totalPrice } = req.body;

  try {
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    // Check for overlapping bookings
    const existingBookings = await Booking.find({
      listingId,
      $or: [{ startDate: { $lt: end }, endDate: { $gt: start } }],
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        message: "The selected dates are not available for this property.",
        available: false,
        conflictingBookings: existingBookings,
      });
    }

    const newBooking = new Booking({ customerId, hostId, listingId, startDate, endDate, totalPrice });
    await newBooking.save();

    res.status(200).json({
      message: "Booking successfully created!",
      booking: newBooking,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Failed to create booking!",
      error: err.message,
    });
  }
});

/* DELETE BOOKING */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: "Error deleting booking", error: err.message });
  }
});

/* CHECK AVAILABILITY */
router.post("/check", async (req, res) => {
  const { listingId, startDate, endDate } = req.body;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      listingId,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    // Check for paid bookings among conflicting bookings
    const paidBookings = conflictingBookings.filter(
      (booking) => booking.paymentStatus === "paid"
    );

    // If there are paid bookings, return the dates as unavailable
    if (paidBookings.length > 0) {
      return res.status(200).json({
        available: false,
        message: "The selected dates are not available because a paid booking already exists.",
        conflictingBookings: paidBookings,  // Return the paid bookings
      });
    }

    // If there are no paid bookings, allow the booking even if there are conflicting unpaid bookings
    return res.status(200).json({
      available: true,
      message: "Dates are available for booking.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error checking booking availability",
      error: err.message,
    });
  }
});


/* FETCH BOOKED DATES FOR A PROPERTY */
router.get("/booked-dates/:listingId", async (req, res) => {
  const { listingId } = req.params;
  try {
    const bookings = await Booking.find({ listingId });
    const bookedDates = bookings.map((booking) => ({
      startDate: booking.startDate,
      endDate: booking.endDate,
    }));

    res.status(200).json({ bookedDates });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    res.status(500).json({ error: "Failed to fetch booked dates" });
  }
});

/* FETCH AVERAGE BOOKINGS PER PROPERTY */
router.get("/average-per-property", async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$listingId",  // Group by listingId
          totalBookings: { $sum: 1 },  // Count the total number of bookings for each property
          sumBookingAmount: {$sum: "$totalPrice"}
        },
      },
      {
        $lookup: {
          from: "listings",  // Join with the listings collection to get property details
          localField: "_id",
          foreignField: "_id",
          as: "listing",
        },
      },
      {
        $unwind: "$listing",  // Flatten the result to access listing data
      },
      {
        $project: {
          title: "$listing.title",  // Get the property title
          averageBookings: "$totalBookings",  // Total bookings per property
          sumBookingAmount : "$sumBookingAmount",
        },
      },
    ]);

    if (stats.length === 0) {
      console.log("No bookings found.");
      return res.status(404).json({ message: "No bookings data available" });
    }

    res.json(stats);  // Send the calculated average bookings per property
  } catch (err) {
    console.error("Error fetching average bookings per property:", err);
    res.status(500).json({
      message: "Failed to fetch average bookings per property.",
      error: err.message,
    });
  }
});


module.exports = router;
