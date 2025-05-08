import { useEffect, useState } from 'react';
import axios from 'axios';
import { useExpense } from '@/context/ExpenseContext';
import BudgetProgressCard from '@/components/BudgetProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Home, 
  ShoppingBag, 
  Utensils, 
  Car, 
  FileText,
  Plus,
  Edit,
  Trash
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { exportToPdf } from '@/utils/exportToPdf';

interface DashboardData {
  totalBudget: number;
  totalSpent: number;
  percentageSpent: number;
  recentExpenses: any[];
  chartData: any[];
}

interface RecentActivity {
  _id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  type?: 'add' | 'update' | 'delete';
}

const Dashboard = () => {
  const { budgets, expenses, categories } = useExpense();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalBudget: 0,
    totalSpent: 0,
    percentageSpent: 0,
    recentExpenses: [],
    chartData: []
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshDashboard = async () => {
      try {
        setLoading(true);
        
        // Fetch recent activities
        const activitiesResponse = await axios.get('http://localhost:3002/recent-activities');
        let activitiesData = activitiesResponse.data;
        
        // Sort activities by date (newest first) and limit to top 5
        const sortedActivities = activitiesData
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setRecentActivities(sortedActivities);

        // Process dashboard data
        const now = new Date();
        const filteredExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          switch (timeframe) {
            case 'weekly':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return expenseDate >= weekAgo;
            case 'monthly':
              return expenseDate.getMonth() === now.getMonth() &&
                     expenseDate.getFullYear() === now.getFullYear();
            case 'yearly':
              return expenseDate.getFullYear() === now.getFullYear();
            default:
              return true;
          }
        });

        const totalBudget = budgets.reduce((acc, budget) => acc + budget.amount, 0);
        const totalSpent = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
        const percentageSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        // Use the sorted activities for both Recent Activities and Recent Expenses
        setDashboardData({
          totalBudget,
          totalSpent,
          percentageSpent,
          recentExpenses: sortedActivities,
          chartData: categories.map((category) => {
            const categoryExpenses = filteredExpenses.filter(e => e.category === category.name);
            const categorySpent = categoryExpenses.reduce((acc, expense) => acc + expense.amount, 0);
            const budget = budgets.find((b) => b.category === category.name);
            
            return {
              name: category.name,
              budget: budget?.amount || 0,
              spent: categorySpent
            };
          })
        });
      } catch (error) {
        console.error('Error refreshing dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

  // Refresh dashboard when expenses, budgets, or categories change
  useEffect(() => {
    refreshDashboard();
  }, [expenses, budgets, categories, timeframe]);

  // Add a separate effect to handle page refresh
  useEffect(() => {
    const handlePageLoad = () => {
      refreshDashboard();
    };

    // Add event listener for page load
    window.addEventListener('load', handlePageLoad);

    // Cleanup
    return () => {
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  const handleAddExpense = () => {
    navigate('/expenses', { state: { showAddDialog: true } });
  };

  const handleExportReport = () => {
    exportToPdf('dashboard-report', 'Dashboard_Report', () => {
      toast({
        title: 'Report Exported',
        description: 'Your dashboard report has been saved as a PDF',
      });
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'food':
        return <Utensils className="h-4 w-4" />;
      case 'transport':
        return <Car className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4" />;
      case 'housing':
        return <Home className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-amber-500" />;
      case 'delete':
        return <Trash className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderActivityItem = (activity: RecentActivity, isCompact = false) => {
    const category = categories.find(c => c.name === activity.category);
    const containerClass = isCompact 
      ? "flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0" 
      : "flex items-center";
    const iconContainerClass = isCompact 
      ? "w-10 h-10 rounded-full mr-3 flex items-center justify-center" 
      : "w-8 h-8 rounded-full mr-2 flex items-center justify-center";
    
    // Apply styling based on activity type
    const isDeleted = activity.type === 'delete';
    const textStyle = isDeleted ? 'line-through text-gray-500' : '';
    
    return (
      <div key={activity._id} className={containerClass}>
        <div className="flex items-center">
          <div 
            className={iconContainerClass}
            style={{ backgroundColor: category?.color ? `${category.color}20` : '#f0f0f0' }}
          >
            {getCategoryIcon(activity.category)}
          </div>
          <div>
            <p className={`${isCompact ? 'font-medium' : 'text-sm font-medium line-clamp-1'} ${textStyle}`}>
              {activity.description}
              {activity.type && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({activity.type})
                </span>
              )}
            </p>
            <div className={`flex items-center ${isCompact ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
              <span>{activity.category || 'Uncategorized'}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(activity.date)}</span>
            </div>
          </div>
        </div>
        {isCompact && <p className="font-semibold">{formatCurrency(activity.amount)}</p>}
      </div>
    );
  };

  const renderRecentActivities = () => {
    if (recentActivities.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No recent activities found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {recentActivities.map(activity => renderActivityItem(activity))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={handleExportReport}>
            <FileText className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
          <Button className="gap-1" onClick={handleAddExpense}>
            <PlusCircle className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      <div id="dashboard-report" className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="animated-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.totalBudget)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For current {timeframe}
                  </p>
                </CardContent>
              </Card>

              <Card className="animated-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalSpent)}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.percentageSpent}% of total budget
                  </p>
                </CardContent>
              </Card>

              <Card className="animated-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalBudget - dashboardData.totalSpent)}</div>
                  <p className="text-xs text-muted-foreground">
                    {100 - dashboardData.percentageSpent}% of total budget
                  </p>
                </CardContent>
              </Card>

              <Card className="animated-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {budgets.length} with active budgets
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recent">Recent Expenses</TabsTrigger>
                <TabsTrigger value="budgets">Budget Tracking</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="col-span-full md:col-span-2">
                    <CardHeader>
                      <CardTitle>Expense Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              fontSize={12} 
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              fontSize={12} 
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => formatCurrency(Number(value))}
                            />
                            <Tooltip formatter={(value) => [formatCurrency(Number(value)), ""]} />
                            <Bar 
                              dataKey="budget" 
                              fill="rgba(120, 120, 250, 0.2)" 
                              name="Budget" 
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="spent" 
                              fill="rgba(30, 70, 230, 0.8)" 
                              name="Spent" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderRecentActivities()}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recentExpenses.map(expense => renderActivityItem(expense, true))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="budgets" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {budgets.map((budget) => (
                    <div key={budget._id}>
                    <BudgetProgressCard
                      category={budget.category}
                      amount={budget.amount}
                        expenses={expenses}
                      icon={getCategoryIcon(budget.category)}
                    />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;