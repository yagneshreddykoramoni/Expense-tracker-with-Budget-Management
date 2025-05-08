const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const ExpenseModel = mongoose.model("expenses", ExpenseSchema);
module.exports = ExpenseModel;
