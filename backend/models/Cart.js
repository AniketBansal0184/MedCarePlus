const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  name: String,
  image: String,
  price: Number,
  quantity: Number,
  category: String,
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [CartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Cart', CartSchema);
