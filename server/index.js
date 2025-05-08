const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Expense = require('./models/expense');
const Budget = require('./models/budget');
const Category = require('./models/category');
const RecentActivity = require('./models/recentActivity');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast notification to all connected clients
const broadcastNotification = (notification) => {
  console.log('Broadcasting notification:', notification);
  console.log('Number of connected clients:', clients.size);

  const message = JSON.stringify(notification);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      console.log('Sending to client:', message);
      client.send(message);
    }
  });
};

app.use(cors());
app.use(express.json());

// MongoDB Connection with proper options
mongoose.connect('mongodb://127.0.0.1:27017/totalexpenses', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Verify RecentActivity collection exists
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const recentActivitiesExists = collections.some(col => col.name === 'recentactivities');
    
    if (!recentActivitiesExists) {
      console.log('Creating RecentActivity collection...');
      await mongoose.connection.createCollection('recentactivities');
      console.log('RecentActivity collection created');
    } else {
      console.log('RecentActivity collection exists');
    }
  } catch (error) {
    console.error('Error checking/creating RecentActivity collection:', error);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// Add error handling for mongoose
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Category routes
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Budget routes
app.get('/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/budgets', async (req, res) => {
  try {
    const budget = new Budget(req.body);
    const newBudget = await budget.save();
    res.status(201).json(newBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add dashboard endpoint
app.get('/dashboard', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        const totalSpent = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        const recentExpenses = expenses.slice(0, 5);

        // Calculate expenses by category
        const expensesByCategory = expenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {});

        res.json({
            totalSpent,
            recentExpenses,
            expensesByCategory,
            totalExpenses: expenses.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all expenses
app.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/expenses/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const recentExpenses = await Expense.find()
        .sort({ date: -1 })
        .limit(limit)
        .lean();
      
      res.json(recentExpenses || []);
    } catch (error) {
      console.error('Error fetching recent expenses:', error);
      res.status(500).json([]);
    }
  });

// Add new expense
app.post('/expenses', async (req, res) => {
    try {
        console.log('Received expense data:', req.body);
        const expense = new Expense(req.body);
        const savedExpense = await expense.save();
        console.log('Saved expense:', savedExpense);

        // Debug logs for large expense notification
        console.log('Checking for large expense:');
        console.log('Amount:', savedExpense.amount);
        console.log('Amount type:', typeof savedExpense.amount);
        console.log('Is amount > 5000:', Number(savedExpense.amount) > 5000);

        // Create activity record for new expense
        const activity = new RecentActivity({
            expenseId: savedExpense._id,
            description: savedExpense.description,
            category: savedExpense.category,
            amount: savedExpense.amount,
            date: new Date(),
            type: 'add'
        });
        await activity.save();

        // Update budget spent amount
        const budget = await Budget.findOne({ category: expense.category });
        if (budget) {
            const totalSpent = await Expense.aggregate([
                { $match: { category: expense.category } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const spent = totalSpent[0]?.total || 0;
            await Budget.findOneAndUpdate(
                { category: expense.category },
                { spent }
            );

            // Check if budget limit is reached
            if (spent >= budget.amount) {
                console.log('Sending budget limit notification');
                broadcastNotification({
                    title: 'Budget Limit Reached',
                    message: `You've reached your budget limit for ${expense.category}`,
                    type: 'warning'
                });
            }
        }

        // Send notification only for large expenses (>5000)
        if (Number(savedExpense.amount) > 5000) {
            console.log('Sending large expense notification');
            const notification = {
                title: 'Large Expense Alert',
                message: `Large expense of ₹${savedExpense.amount} added for ${savedExpense.description}`,
                type: 'warning'
            };
            console.log('Notification object:', notification);
            broadcastNotification(notification);
        }

        res.status(201).json(savedExpense);
    } catch (error) {
        console.error('Error in /expenses POST:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update expense
app.put('/expenses/:id', async (req, res) => {
    try {
        const oldExpense = await Expense.findById(req.params.id);
        if (!oldExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        // Update budgets if category or amount changed
        if (oldExpense.category !== expense.category || oldExpense.amount !== expense.amount) {
            // Calculate total spent for old category
            const oldCategoryExpenses = await Expense.find({ category: oldExpense.category });
            const oldTotalSpent = oldCategoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            // Update old category budget
            await Budget.findOneAndUpdate(
                { category: oldExpense.category },
                { spent: oldTotalSpent },
                { new: true }
            );

            // Calculate total spent for new category
            const newCategoryExpenses = await Expense.find({ category: expense.category });
            const newTotalSpent = newCategoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            // Update new category budget
            await Budget.findOneAndUpdate(
                { category: expense.category },
                { spent: newTotalSpent },
                { new: true }
            );
        }

        // Update budget spent amount
        const budget = await Budget.findOne({ category: expense.category });
        if (budget) {
            const totalSpent = await Expense.aggregate([
                { $match: { category: expense.category } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const spent = totalSpent[0]?.total || 0;
            await Budget.findOneAndUpdate(
                { category: expense.category },
                { spent }
            );

            // Check if budget limit is reached
            if (spent >= budget.amount) {
                broadcastNotification({
                    title: 'Budget Limit Reached',
                    message: `You've reached your budget limit for ${expense.category}`,
                    type: 'warning'
                });
            }
        }

        // Create activity record for edit
        const activity = new RecentActivity({
            expenseId: expense._id,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            date: new Date(),
            type: 'update'
        });
        await activity.save();

        res.json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete expense
app.delete('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Store expense data before deletion
        const expenseData = {
            _id: expense._id,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            date: expense.date
        };

        // Create activity record for deletion BEFORE deleting the expense
        const activity = new RecentActivity({
            expenseId: expenseData._id,
            description: expenseData.description,
            category: expenseData.category,
            amount: expenseData.amount,
            date: new Date(),
            type: 'delete'
        });
        await activity.save();

        // Delete the expense
        await Expense.findByIdAndDelete(req.params.id);

        // Update budget spent amount
        const budget = await Budget.findOne({ category: expenseData.category });
        if (budget) {
            const totalSpent = await Expense.aggregate([
                { $match: { category: expenseData.category } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const spent = totalSpent[0]?.total || 0;
            await Budget.findOneAndUpdate(
                { category: expenseData.category },
                { spent }
            );
        }
        
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
});

// Add this with your other routes
app.get('/recent-activities', async (req, res) => {
  try {
    console.log('Fetching recent activities...');
    const activities = await RecentActivity
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(); // Use lean() for better performance
    
    console.log('Found activities:', activities);
    
    // Ensure all dates are properly formatted
    const formattedActivities = activities.map(activity => ({
      ...activity,
      date: activity.date ? new Date(activity.date).toISOString() : new Date().toISOString(),
      createdAt: activity.createdAt ? new Date(activity.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: activity.updatedAt ? new Date(activity.updatedAt).toISOString() : new Date().toISOString()
    }));
    
    console.log('Formatted activities:', formattedActivities);
    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a test endpoint to check if RecentActivity model is working
app.post('/test-activity', async (req, res) => {
  try {
    console.log('Creating test activity...');
    const activity = new RecentActivity({
      expenseId: new mongoose.Types.ObjectId(),
      description: 'Test Activity',
      category: 'Test',
      amount: 100,
      date: new Date(),
      type: 'add'
    });
    const savedActivity = await activity.save();
    console.log('Test activity saved:', savedActivity);
    res.json(savedActivity);
  } catch (error) {
    console.error('Error creating test activity:', error);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});