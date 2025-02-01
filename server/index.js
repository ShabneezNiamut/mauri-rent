const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv").config();
const path = require("path");  // Ensure you import the 'path' module

const authRoutes = require("./routes/auth.js");
const listingRoutes = require("./routes/listing.js");
const bookingRoutes = require("./routes/booking.js"); 
const userRoutes = require("./routes/user.js"); 
const adminRoutes = require("./routes/admin.js");
const reviewRoutes = require("./routes/review");
const contactSupportRoutes = require("./routes/contactSupport");
const paymentRoutes = require("./routes/payment");

app.use(cors());
app.use(express.json());
app.use(express.static('public'));  // Serve static files from public directory

// Custom route for downloading files
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public/uploads', filename);
    console.log("Attempting to download:", filePath); // Log the file path being accessed

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(404).send('File not found');
        }
    });
});

/* Routes */
app.use("/auth", authRoutes);
app.use("/listings", listingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/review", reviewRoutes);
app.use("/contact", contactSupportRoutes);
app.use("/payment", paymentRoutes);

/* MONGOOSE SETUP */
const PORT = 3001;
mongoose
    .connect(process.env.MONGO_URL, {
        dbName: "Home_Rental",
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    })
    .catch((err) => console.log(`${err} did not connect`));
