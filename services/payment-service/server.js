const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/payments');

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: String,
  amount: Number,
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);

app.post('/payments', async (req, res) => {
  try {
    const { amount, userId } = req.body;
    
    // Simulate payment processing
    const paymentId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const payment = new Payment({
      paymentId,
      userId,
      amount,
      status: 'completed'
    });
    
    await payment.save();
    
    res.json({ paymentId, status: 'completed', amount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/payments/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
