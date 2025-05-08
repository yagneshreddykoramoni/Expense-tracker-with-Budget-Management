import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Expense, 
  Budget, 
  Category 
} from '@/lib/data';
import { 
  fetchExpenses,
  fetchBudgets,
  fetchCategories,
  createExpense,
  updateExpense as updateExpenseApi,
  deleteExpense as deleteExpenseApi,
  createBudget,
  updateBudget as updateBudgetApi,
  deleteBudget as deleteBudgetApi,
  createCategory,
  deleteCategory as deleteCategoryApi
} from '@/lib/api';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, '_id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, '_id'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  categories: Category[];
  addCategory: (category: Omit<Category, '_id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
  getBudgetByCategory: (category: string) => Budget | undefined;
  getExpensesByCategory: (category: string) => Expense[];

  // Add fetch functions
  fetchBudgets: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Add fetch functions
  const fetchExpensesData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch expenses',
        variant: 'destructive',
      });
    }
  };

  const fetchBudgetsData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/budgets`);
      setBudgets(response.data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch budgets',
        variant: 'destructive',
      });
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  };

  // Add refreshAllData function
  const refreshAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchExpensesData(),
        fetchBudgetsData(),
        fetchCategoriesData()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the loadData function
  useEffect(() => {
    refreshAllData();
  }, []);

  // Expense functions
  const addExpense = async (expense: Omit<Expense, '_id'>) => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/expenses`, expense);
      const newExpense = response.data;
      
      // Update expenses state immediately
      setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
      
      // Check budget thresholds
      const budget = budgets.find(b => b.category === expense.category);
      if (budget) {
        const totalSpent = expenses
          .filter(e => e.category === expense.category)
          .reduce((sum, e) => sum + e.amount, 0) + expense.amount;
        
        const percentage = (totalSpent / budget.amount) * 100;
        
        if (percentage > 90) {
          toast({
            title: 'Budget Warning',
            description: `You've used ${Math.round(percentage)}% of your ${budget.category} budget!`,
            variant: 'destructive',
          });
        }
      }
      
      // Refresh budgets to ensure spent amounts are correct
      await fetchBudgetsData();
    } catch (error) {
      console.error('Failed to add expense:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to add expense');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      setLoading(true);
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/expenses/${id}`, expense);
      // Update expenses state immediately
      setExpenses(prev => prev.map(e => e._id === id ? response.data : e));
      
      // Refresh budgets to ensure spent amounts are correct
      await fetchBudgetsData();
    } catch (error) {
      console.error('Failed to update expense:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update expense');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setLoading(true);
      const expenseToDelete = expenses.find(e => e._id === id);
      
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/expenses/${id}`);
      
      // Update expenses state immediately
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp._id !== id));
      
      // Refresh budgets to ensure spent amounts are correct
      await fetchBudgetsData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete expense');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Budget functions
  const addBudget = async (budget: Omit<Budget, '_id'>) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/budgets`, budget);
      setBudgets(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add budget');
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/budgets/${id}`, budget);
      setBudgets(prev => prev.map(b => b._id === id ? response.data : b));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b._id !== id));
    } catch (error) {
      throw new Error('Failed to delete budget');
    }
  };

  // Category functions
  const addCategory = async (category: Omit<Category, '_id'>) => {
    try {
      const newCategory = await createCategory(category);
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/categories/${id}`);
      setCategories(prev => prev.filter(category => category._id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  // Helper functions
  const getCategoryById = (id: string) => {
    return categories.find((c) => c._id === id);
  };

  const getCategoryByName = (name: string) => {
    return categories.find((c) => c.name === name);
  };

  const getBudgetByCategory = (category: string) => {
    return budgets.find((b) => b.category === category);
  };

  const getExpensesByCategory = (category: string) => {
    return expenses.filter((e) => e.category === category);
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        categories,
        addCategory,
        deleteCategory,
        getCategoryById,
        getCategoryByName,
        getBudgetByCategory,
        getExpensesByCategory,
        fetchBudgets: fetchBudgetsData,
        fetchCategories: fetchCategoriesData,
        fetchExpenses: fetchExpensesData,
        refreshAllData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
