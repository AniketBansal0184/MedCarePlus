const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // enforce uniqueness
    lowercase: true, // auto convert to lowercase
    trim: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
