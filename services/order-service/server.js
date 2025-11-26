const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/orders');

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: Array,
  total: Number,
  status: { type: String, default: 'pending' },
  paymentId: String,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await axios.get('http://auth-service:3001/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    req.userId = response.data.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.get('/orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/orders', verifyToken, async (req, res) => {
  try {
    // Get cart items
    const cartResponse = await axios.get(`${process.env.CART_SERVICE_URL || 'http://localhost:3004'}/cart`, {
      headers: { Authorization: req.headers.authorization }
    });
    const cart = cartResponse.data;
    
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Calculate total
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Process payment
    const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006'}/payments`, {
      amount: total,
      userId: req.userId
    });
    
    // Create order
    const order = new Order({
      userId: req.userId,
      items: cart.items,
      total: total,
      paymentId: paymentResponse.data.paymentId,
      status: 'confirmed'
    });
    
    await order.save();
    
    // Clear cart
    await axios.delete(`${process.env.CART_SERVICE_URL || 'http://localhost:3004'}/cart/clear`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
