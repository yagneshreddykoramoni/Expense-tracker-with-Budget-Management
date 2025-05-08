const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  timeframe: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Budget', budgetSchema);