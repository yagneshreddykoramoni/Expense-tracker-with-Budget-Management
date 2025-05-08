import { Expense } from '@/lib/data';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Edit, Trash } from 'lucide-react';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  categoryColor: string;
}

const ExpenseItem = ({ expense, onEdit, onDelete, categoryColor }: ExpenseItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 shadow-sm border border-border hover:border-primary/20 transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <h3 className="font-medium">{expense.description}</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(expense.date), 'MMM dd, yyyy')} · {expense.category}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{formatCurrency(expense.amount)}</span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(expense)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(expense._id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseItem;
