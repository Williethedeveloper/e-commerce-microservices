const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/notifications');

const NotificationSchema = new mongoose.Schema({
  userId: String,
  message: String,
  type: { type: String, enum: ['email', 'sms', 'push'], default: 'email' },
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);

app.post('/notifications', async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    
    const notification = new Notification({
      userId,
      message,
      type,
      sent: true // Simulate sending
    });
    
    await notification.save();
    console.log(`📧 ${type.toUpperCase()} sent to user ${userId}: ${message}`);
    
    res.json({ success: true, notificationId: notification._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
