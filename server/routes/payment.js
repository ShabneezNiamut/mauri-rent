const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Your Stripe secret key
const router = express.Router();
const Booking = require("../models/Booking");
const Listing = require('../models/Listing');
const User = require('../models/User');

router.post("/create-checkout-session", async (req, res) => {
  const { amount, bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: "Booking ID is required" });
  }

  try {
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', 
            product_data: {
              name: 'Mauri Rent Booking Payment', // Example product name
            },
            unit_amount: amount, // The amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`, // Updated URL with session_id
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`, 
      client_reference_id: bookingId, 
    });

    // Return the session ID to the frontend
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/payment-success", async (req, res) => {
  console.log('Payment success route hit', req.body);  // Log the incoming request

  const { sessionId } = req.body;  // The session ID from the frontend
  try {
    // Log sessionId to verify it's being sent correctly
    console.log('Received sessionId:', sessionId);

    // Retrieve the Stripe session using the sessionId
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Log the session data
    console.log('Session data:', session);

    // Retrieve the booking using the client_reference_id (which is stored when creating the session)
    const booking = await Booking.findOne({ _id: session.client_reference_id });
    console.log('Booking data:', booking);

    if (booking) {
      booking.paymentStatus = "paid";
      await booking.save();  // Save the updated booking

      // Fetch the listing using the listingId
      const listing = await Listing.findById(booking.listingId);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found." });
      }

      // Fetch the user (host) using the creator id from the listing
      const user = await User.findById(listing.creator);
      if (!user) {
        return res.status(404).json({ error: "User (host) not found." });
      }

      const paymentDetails = {
        listingTitle: listing.title,
        userName: `${user.firstName} ${user.lastName}`, 
        pricePaid: booking.totalPrice,
        paymentDate: booking.updatedAt,  // Use the updated timestamp as payment date
      };

      res.status(200).json({ message: "Payment successful and booking status updated.", paymentDetails });
    } else {
      res.status(404).json({ error: "Booking not found." });
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
