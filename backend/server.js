const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Coupon = require('./models/Coupon');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection with error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB connected successfully');

  // Seed coupons if collection is empty
  try {
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const coupons = [
        { code: 'SAVE10', discount: 10 },
        { code: 'SAVE15', discount: 15 },
        { code: 'SAVE20', discount: 20 },
      ];
      await Coupon.insertMany(coupons);
      console.log('Coupons seeded successfully');
    } else {
      console.log('Coupons already exist, skipping seeding');
    }
  } catch (err) {
    console.error('Error seeding coupons:', err);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process on connection failure
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));