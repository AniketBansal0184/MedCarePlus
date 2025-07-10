const mongoose = require('mongoose');

const deleteFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  createdAt: Date,
});

module.exports = mongoose.model('DeleteFeedback', deleteFeedbackSchema);
