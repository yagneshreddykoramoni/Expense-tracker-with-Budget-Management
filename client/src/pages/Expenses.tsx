import { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { Expense } from '@/lib/data';
import ExpenseItem from '@/components/ExpenseItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Edit, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { describe } from 'node:test';
import axios from 'axios';
import { format } from 'date-fns';

const Expenses = () => {
  const location = useLocation();
  const { expenses, categories, addExpense, updateExpense, deleteExpense, fetchBudgets } = useExpense();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  
  const getCurrentDateInIST = () => {
    const now = new Date();
    // Convert to IST by adding 5 hours and 30 minutes
    const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString().split('T')[0];
  };

  const [newExpense, setNewExpense] = useState({
    _id: '',
    amount: '',
    category: '',
    description: '',
    date: getCurrentDateInIST()
  });

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchTerm(location.state.searchQuery);
      window.history.replaceState({}, document.title);
    }
    
    if (location.state?.showAddDialog) {
      setDialogMode('add');
      setShowAddDialog(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAddExpense = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(newExpense.amount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
  
      if (!newExpense.category) {
        throw new Error('Please select a category');
      }
  
      if (dialogMode === 'add') {
        const expenseData = {
          amount,
          category: newExpense.category,
          description: newExpense.description,
          date: newExpense.date
        };

        // Use the context's addExpense function
        await addExpense(expenseData);
  
        // Refresh budgets to update spent amounts
        await fetchBudgets();
  
        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });
  
        // Reset form
        setNewExpense({
          _id: '',
          amount: '',
          category: '',
          description: '',
          date: getCurrentDateInIST()
        });
  
        setShowAddDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = async (id: string) => {
    try {
      setLoading(true);
      const amount = parseFloat(newExpense.amount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
  
      if (!newExpense.category) {
        throw new Error('Please select a category');
      }
  
      const expenseData = {
        amount,
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date
      };

      // Use the context's updateExpense function
      await updateExpense(id, expenseData);
  
      // Refresh budgets to update spent amounts
      await fetchBudgets();
  
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
  
      // Reset form and close dialog
      setNewExpense({
        _id: '',
        amount: '',
        category: '',
        description: '',
        date: getCurrentDateInIST()
      });
  
      setShowAddDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update expense',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      setLoading(true);
      await deleteExpense(id);
      
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete expense',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setDialogMode('edit');
    setNewExpense({
      _id: expense._id,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date
    });
    setShowAddDialog(true);
  };

  // Add loading state to the UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-1" onClick={() => {
                setDialogMode('add');
                setNewExpense({
                _id: '',
                  amount: '',
                  category: '',
                  description: '',
                  date: getCurrentDateInIST()
                });
            }}>
              <PlusCircle className="h-4 w-4" />
              <span>Add Expense</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogMode === 'add' ? 'Add New Expense' : 'Edit Expense'}</DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' 
                  ? 'Add a new expense to your tracker.' 
                  : 'Update the details of your expense.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="amount" className="text-right text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right text-sm font-medium">
                  Category
                </label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="date" className="text-right text-sm font-medium">
                  Date
                </label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={dialogMode === 'add' ? handleAddExpense : () => handleEditExpense(newExpense._id)} 
                disabled={loading}
              >
                {loading ? 'Processing...' : dialogMode === 'add' ? 'Add Expense' : 'Update Expense'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search expenses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {sortedExpenses.length > 0 ? (
            sortedExpenses.map((expense) => {
              const category = categories.find(c => c.name === expense.category);
              return (
                <ExpenseItem
                  key={expense._id}
                  expense={expense}
                  onEdit={() => handleEditClick(expense)}
                  onDelete={() => handleDeleteExpense(expense._id)}
                  categoryColor={category?.color || '#ccc'}
                />
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No expenses found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                {searchTerm || categoryFilter !== 'all'
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "You haven't added any expenses yet. Add one to get started!"}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    setDialogMode('add');
                    setShowAddDialog(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Expense
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
