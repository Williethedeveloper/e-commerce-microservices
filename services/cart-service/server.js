const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/cart');

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{
    productId: String,
    quantity: Number,
    price: Number
  }]
});

const Cart = mongoose.model('Cart', CartSchema);

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

app.get('/cart', verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/cart/add', verifyToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Get product details
    const productResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003'}/products/${productId}`);
    const product = productResponse.data;
    
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price: product.price });
    }
    
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/cart/remove/:productId', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    cart.items = cart.items.filter(item => item.productId !== req.params.productId);
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Cart Service running on port ${PORT}`));
