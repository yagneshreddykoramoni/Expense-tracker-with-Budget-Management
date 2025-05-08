import { cn, formatCurrency } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Expense } from '@/lib/data';

interface BudgetProgressCardProps {
  category: string;
  amount: number;
  expenses: Expense[];
  icon?: React.ReactNode;
  className?: string;
}

const BudgetProgressCard = ({
  category,
  amount,
  expenses,
  icon,
  className
}: BudgetProgressCardProps) => {
  // Calculate spent amount from expenses
  const spent = expenses
    .filter(e => e.category === category)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const percentage = Math.min(Math.round((spent / amount) * 100), 100);
  
  let statusColor = 'bg-expense-low';
  if (percentage >= 85) {
    statusColor = 'bg-expense-high';
  } else if (percentage >= 60) {
    statusColor = 'bg-expense-medium';
  }

  return (
    <Card className={cn("animated-card h-full overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{category}</CardTitle>
        <div className={`rounded-full p-2 ${percentage >= 85 ? 'bg-expense-high/10' : percentage >= 60 ? 'bg-expense-medium/10' : 'bg-expense-low/10'}`}>
          {icon || <CreditCard className={`h-4 w-4 ${percentage >= 85 ? 'text-expense-high' : percentage >= 60 ? 'text-expense-medium' : 'text-expense-low'}`} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(spent)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ {formatCurrency(amount)}</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Progress</span>
            <span className={cn(
              "font-medium",
              percentage >= 85 ? "text-expense-high" : 
              percentage >= 60 ? "text-expense-medium" : 
              "text-expense-low"
            )}>
              {percentage}%
            </span>
          </div>
          <Progress
            value={percentage}
            className={cn("h-2", percentage >= 85 ? "bg-expense-high/20" : percentage >= 60 ? "bg-expense-medium/20" : "bg-expense-low/20")}
            indicatorClassName={statusColor}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetProgressCard;
