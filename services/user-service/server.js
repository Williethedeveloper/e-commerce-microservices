const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/users');

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  address: String,
  phone: String
});

const Profile = mongoose.model('Profile', ProfileSchema);

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const response = await axios.get(`${authUrl}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    req.userId = response.data.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.get('/profile', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    res.json(profile || {});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/profile', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body, userId: req.userId },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
