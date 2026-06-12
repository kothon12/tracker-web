const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("Database Connection Error:", err));

const LocationSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', LocationSchema);

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

app.get('/api/location/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const history = await Location.find({ phoneNumber }).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/operator-track', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const newLocation = new Location({
      phoneNumber,
      latitude: 23.8103, 
      longitude: 90.4125,
      timestamp: new Date()
    });

    await newLocation.save();
    res.status(200).json({ message: "Location fetched from operator simulated gateway", data: newLocation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});