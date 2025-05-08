const mongoose = require('mongoose');

const recentActivitySchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['add', 'update', 'delete'],
    default: 'add'
  }
}, {
  timestamps: true,
  collection: 'recentactivities' // Explicitly set collection name
});

// Keep only last 5 activities
recentActivitySchema.post('save', async function() {
  try {
    const count = await this.constructor.countDocuments();
    if (count > 5) {
      // Get the 5th most recent activity
      const fifthActivity = await this.constructor
        .find()
        .sort({ createdAt: -1 })
        .skip(4)
        .limit(1);
      
      if (fifthActivity.length > 0) {
        // Delete all activities older than the 5th one
        await this.constructor.deleteMany({
          createdAt: { $lt: fifthActivity[0].createdAt }
        });
      }
    }
  } catch (error) {
    console.error('Error in recentActivitySchema post-save hook:', error);
  }
});

// Add index for better query performance
recentActivitySchema.index({ createdAt: -1 });

const RecentActivity = mongoose.model('RecentActivity', recentActivitySchema);

module.exports = RecentActivity;