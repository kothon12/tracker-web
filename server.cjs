// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // JSON ডাটা রিসিভ করার জন্য

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("Database Connection Error:", err));

// Schema & Model (ডাটাবেজ টেবিল স্ট্রাকচার)
const LocationSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', LocationSchema);

// ---- API Routes (এপিআই রুটসমূহ) ----

// ১. নতুন লোকেশন ডাটা রিসিভ ও সেভ করার API (POST)
app.post('/api/location', async (req, res) => {
  try {
    const { phoneNumber, latitude, longitude } = req.body;
    if (!phoneNumber || !latitude || !longitude) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newLocation = new Location({
      phoneNumber,
      latitude,
      longitude,
      timestamp: new Date()
    });

    await newLocation.save();
    res.status(201).json({ message: "Location saved successfully!", data: newLocation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ২. নির্দিষ্ট মোবাইল নম্বরের লোকেশন হিস্ট্রি পাওয়ার API (GET)
app.get('/api/location/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    // ডাটাবেজ থেকে নির্দিষ্ট নম্বরের সব ডাটা সময় অনুযায়ী সর্ট করে আনা
    const history = await Location.find({ phoneNumber }).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// সার্ভার পোর্ট লিসেন করা
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});