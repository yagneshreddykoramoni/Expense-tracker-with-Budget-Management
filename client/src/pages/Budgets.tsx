import { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import BudgetProgressCard from '@/components/BudgetProgressCard';
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
import { motion } from 'framer-motion';
import { PlusCircle, Wallet } from 'lucide-react';

const Budgets = () => {
  const { 
    budgets, 
    categories, 
    expenses,
    addBudget, 
    updateBudget, 
    deleteBudget, 
    fetchBudgets, 
    fetchCategories, 
    fetchExpenses 
  } = useExpense();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  
  const [newBudget, setNewBudget] = useState({
    _id: '',
    category: '',
    amount: '',
    spent: 0,
    timeframe: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  });

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBudgets(),
          fetchCategories(),
          fetchExpenses()
        ]);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const availableCategories = categories.filter(
    (category) => !budgets.some((budget) => budget.category === category.name)
  );

  const calculateSpentAmount = (categoryName: string) => {
    const categoryExpenses = expenses.filter(exp => exp.category === categoryName);
    return categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const handleAddBudget = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(newBudget.amount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (!newBudget.category) {
        throw new Error('Please select a category');
      }
      
      if (dialogMode === 'add') {
        if (budgets.some(b => b.category === newBudget.category)) {
          throw new Error('A budget for this category already exists');
        }
        
        const spent = calculateSpentAmount(newBudget.category);
        
        await addBudget({
          category: newBudget.category,
          amount,
          spent,
          timeframe: 'monthly'
        });
        
        toast({
          title: 'Success',
          description: `Budget for ${newBudget.category} has been added`,
        });
      } else {
        const spent = calculateSpentAmount(newBudget.category);
        
        await updateBudget(newBudget._id, {
          category: newBudget.category,
          amount,
          spent
        });
        
        toast({
          title: 'Success',
          description: `Budget for ${newBudget.category} has been updated`,
        });
      }
      
      // Reset form
      setNewBudget({
        _id: '',
        category: '',
        amount: '',
        spent: 0,
        timeframe: 'monthly' as 'weekly' | 'monthly' | 'yearly',
      });
      
      setShowDialog(false);
      await fetchBudgets(); // Refresh budgets list
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBudget = (id: string) => {
    const budget = budgets.find(b => b._id === id);
    if (budget) {
      setNewBudget({
        _id: budget._id,
        category: budget.category,
        amount: budget.amount.toString(),
        spent: budget.spent,
        timeframe: budget.timeframe,
      });
      setDialogMode('edit');
      setShowDialog(true);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      setLoading(true);
      await deleteBudget(id);
      toast({
        title: 'Success',
        description: 'Budget has been deleted',
      });
      await fetchBudgets(); // Refresh budgets list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setDialogMode('add');
              setNewBudget({
                _id: '',
                category: '',
                amount: '',
                spent: 0,
                timeframe: 'monthly' as 'weekly' | 'monthly' | 'yearly',
              });
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogMode === 'add' ? 'Add New Budget' : 'Edit Budget'}</DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' 
                  ? 'Set a budget limit for a specific category.' 
                  : 'Update the budget limit for this category.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right text-sm font-medium">
                  Category
                </label>
                {dialogMode === 'add' ? (
                  <Select
                    value={newBudget.category}
                    onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                    disabled={availableCategories.length === 0}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="category"
                    value={newBudget.category}
                    disabled
                    className="col-span-3"
                  />
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="amount" className="text-right text-sm font-medium">
                  Budget Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="col-span-3"
                />
              </div>
              {dialogMode === 'edit' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="spent" className="text-right text-sm font-medium">
                    Spent So Far
                  </label>
                  <Input
                    id="spent"
                    type="number"
                    value={newBudget.spent}
                    disabled
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddBudget}
                disabled={loading || (dialogMode === 'add' && availableCategories.length === 0)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {dialogMode === 'add' ? 'Adding...' : 'Updating...'}
                  </div>
                ) : (
                  dialogMode === 'add' ? 'Add Budget' : 'Update Budget'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <div key={budget._id} className="relative group">
              <BudgetProgressCard
                category={budget.category}
                amount={budget.amount}
                expenses={expenses}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => handleEditBudget(budget._id)}
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteBudget(budget._id)}
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No budgets found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            You haven't added any budgets yet. Set a budget to track your spending limits.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setDialogMode('add');
              setShowDialog(true);
            }}
            disabled={availableCategories.length === 0}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Your First Budget
          </Button>
          {availableCategories.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              No available categories to create a budget. Add categories first.
            </p>
          )}
        </motion.div>
      )}

      {budgets.length > 0 && availableCategories.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Categories Without Budgets</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {availableCategories.map((category) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg p-5 border border-border hover:border-primary/20 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-medium">{category.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setDialogMode('add');
                      setNewBudget({
                        _id: '',
                        category: category.name,
                        amount: '',
                        spent: 0,
                        timeframe: 'monthly' as 'weekly' | 'monthly' | 'yearly',
                      });
                      setShowDialog(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Add budget</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">No budget set</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;