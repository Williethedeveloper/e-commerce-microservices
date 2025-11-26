const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/products');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  stock: { type: Number, default: 0 },
  image: String
});

const Product = mongoose.model('Product', ProductSchema);

// Seed some products
const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    const products = [
      { name: 'Laptop', description: 'Gaming Laptop', price: 999, category: 'Electronics', stock: 10, image: 'laptop.jpg' },
      { name: 'Phone', description: 'Smartphone', price: 599, category: 'Electronics', stock: 20, image: 'phone.jpg' },
      { name: 'Headphones', description: 'Wireless Headphones', price: 199, category: 'Electronics', stock: 15, image: 'headphones.jpg' },
      { name: 'Book', description: 'Programming Book', price: 49, category: 'Books', stock: 30, image: 'book.jpg' }
    ];
    await Product.insertMany(products);
    console.log('Products seeded');
  }
};

seedProducts();

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
