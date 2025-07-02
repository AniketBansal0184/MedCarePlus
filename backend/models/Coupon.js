const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true 
  },
  discount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  expiresAt: { 
    type: Date, 
    default: null 
  },
  maxUses: { 
    type: Number, 
    default: null, 
    min: 1 
  },
  usedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
}, { timestamps: true });

couponSchema.index({ code: 1 }); 

module.exports = mongoose.model('Coupon', couponSchema);