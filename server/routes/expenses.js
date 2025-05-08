const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');
const RecentActivity = require('../models/recentActivity');

// Get all expenses (sorted by date descending)
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get recent expenses (limited count)
router.get('/recent', async (req, res) => {
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

// Create new expense
router.post('/', async (req, res) => {
    try {
        console.log('Creating new expense:', req.body);
        const expense = new Expense(req.body);
        const savedExpense = await expense.save();
        console.log('Expense saved:', savedExpense);
        
        // Create activity record
        console.log('Creating activity record...');
        const activity = new RecentActivity({
            expenseId: savedExpense._id,
            description: savedExpense.description,
            category: savedExpense.category,
            amount: savedExpense.amount,
            date: new Date(savedExpense.date),
            type: 'add'
        });
        
        try {
            const savedActivity = await activity.save();
            console.log('Activity saved:', savedActivity);
            
            // Return both the expense and the activity
            res.status(201).json({
                expense: savedExpense,
                activity: savedActivity
            });
        } catch (activityError) {
            console.error('Error saving activity:', activityError);
            // Still return the expense even if activity saving fails
            res.status(201).json({
                expense: savedExpense,
                activityError: activityError.message
            });
        }
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
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
        
        // Create activity record for update
        const activity = new RecentActivity({
            expenseId: expense._id,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            date: new Date(expense.date),
            type: 'update'
        });
        await activity.save();
        
        res.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Create activity record for deletion BEFORE deleting the expense
        const activity = new RecentActivity({
            expenseId: expense._id,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            date: new Date(expense.date),
            type: 'delete'
        });
        await activity.save();

        // Now delete the expense
        await Expense.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
});

// Get expenses summary for dashboard
router.get('/dashboard/summary', async (req, res) => {
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

module.exports = router;