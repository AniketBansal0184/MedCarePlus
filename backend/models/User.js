const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    verified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedByAdmin: { type: Boolean, default: false }, 
    feedback: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },   
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
