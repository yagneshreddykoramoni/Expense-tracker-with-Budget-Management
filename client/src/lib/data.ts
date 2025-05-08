export type Expense = {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Budget = {
  _id?: string;
  category: string;
  amount: number;
  spent: number;
  timeframe: 'weekly' | 'monthly' | 'yearly';
};

export type Category = {
  _id?: string;
  name: string;
  color: string;
  icon?: string;
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const calculateTotalSpent = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

export const calculateBudgetProgress = (budget: Budget): number => {
  return Math.min((budget.spent / budget.amount) * 100, 100);
};
