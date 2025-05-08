import { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToPdf } from '@/utils/exportToPdf';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';

const Reports = () => {
  const { expenses, budgets } = useExpense();
  const { toast } = useToast();
  
  const getCurrentDateInIST = () => {
    const now = new Date();
    // Convert to IST by adding 5 hours and 30 minutes
    const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString().split('T')[0];
  };

  const getLastMonthDateInIST = () => {
    const now = new Date();
    // Convert to IST by adding 5 hours and 30 minutes
    const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    // Go back one month while keeping the same day
    istDate.setMonth(istDate.getMonth() - 1);
    return istDate.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getLastMonthDateInIST());
  const [endDate, setEndDate] = useState(getCurrentDateInIST());
  const [categories, setCategories] = useState([]);
  
  // Fetch categories directly from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3002/categories');
        console.log('Raw categories from database:', response.data); // Debug log
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
    fetchCategories();
  }, []);
  
  // Filter expenses by date range
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate >= new Date(startDate) && 
      expenseDate <= new Date(endDate)
    );
  });
  
  // Calculate total spent
  const totalSpent = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const handleExportReport = () => {
    exportToPdf('reports-container', 'Expense_Report', () => {
      toast({
        title: 'Report Exported',
        description: 'Your expense report has been saved as a PDF',
      });
    });
  };
  
  // Calculate expenses by category with color validation
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  console.log('Raw expenses by category:', expensesByCategory);
  console.log('All categories from database:', categories);

  // Calculate total for percentage
  const totalAmount = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => {
      const category = categories.find(c => c.name === name);
      // Ensure color is in hex format and valid
      const color = category?.color?.startsWith('#') ? category.color : `#${category?.color}`;
      console.log(`Processing category ${name}:`, {
        found: !!category,
        originalColor: category?.color,
        processedColor: color,
        value
      });
    return {
        name,
        value: Number(value),
        color: color || '#8884d8',
        percentage: totalAmount ? (Number(value) / totalAmount) * 100 : 0
    };
    })
    .sort((a, b) => b.value - a.value); // Sort by value in descending order

  console.log('Final pie chart data (sorted):', pieData);
  
  // Get expense data over time (by day)
  const getDailyExpenseData = () => {
    const dateMap = new Map();
    
    filteredExpenses.forEach((expense) => {
      // Convert expense date to IST
      const expenseDate = new Date(expense.date);
      const istDate = new Date(expenseDate.getTime() + (5.5 * 60 * 60 * 1000));
      const date = istDate.toISOString().split('T')[0];
      
      const existingAmount = dateMap.get(date) || 0;
      dateMap.set(date, existingAmount + expense.amount);
    });
    
    // Convert to array and sort by date
    const result = Array.from(dateMap, ([date, amount]) => ({ date, amount }));
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result;
  };
  
  // Get budget vs actual data
  const getBudgetVsActualData = () => {
    return categories.map((category) => {
      const budget = budgets.find((b) => b.category === category.name);
      const spent = filteredExpenses
        .filter((e) => e.category === category.name)
        .reduce((total, expense) => total + expense.amount, 0);
      
      return {
        name: category.name,
        budget: budget?.amount || 0,
        spent: spent,
      };
    }).filter(item => item.budget > 0 || item.spent > 0);
  };
  
  const dailyExpenseData = getDailyExpenseData();
  const budgetVsActualData = getBudgetVsActualData();
  
  // Format for pie chart tooltip
  const pieTooltipFormatter = (value: number, name: string) => {
    const item = pieData.find(cat => cat.name === name);
    return [`${formatCurrency(value)} (${item?.percentage.toFixed(1)}%)`, name];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={handleExportReport}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-1">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div id="reports-container" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Filter Expenses</CardTitle>
            <CardDescription>
              Select a date range to analyze your spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="animated-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <div className="rounded-full p-2 bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                During selected period ({filteredExpenses.length} transactions)
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="category" className="space-y-4">
          <TabsList>
            <TabsTrigger value="category" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span>By Category</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center gap-1">
              <LineChartIcon className="h-4 w-4" />
              <span>Over Time</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span>Budget vs. Actual</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="category">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  Breakdown of your expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-[32rem]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={160}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                            >
                              {pieData.map((entry, index) => {
                                const color = entry.color;
                                console.log(`Rendering pie segment for ${entry.name}:`, {
                                  color,
                                  value: entry.value,
                                  index
                                });
                                return (
                                <Cell 
                                  key={`cell-${index}`} 
                                    fill={color}
                                    stroke={color}
                                    strokeWidth={2}
                                    style={{ fill: color }}
                                />
                                );
                              })}
                            </Pie>
                            <RechartsTooltip 
                              formatter={pieTooltipFormatter} 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-4">
                        {pieData
                          .map((category) => (
                            <div key={category.name} className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: category.color }}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">{category.name}</span>
                                  <span>{formatCurrency(category.value)}</span>
                                </div>
                                <div className="mt-1 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${category.percentage}%`,
                                      backgroundColor: category.color,
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-right mt-1">
                                  {category.percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center py-12">
                      <PieChartIcon className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No expense data available for the selected period
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="time">
            <Card>
              <CardHeader>
                <CardTitle>Expenses Over Time</CardTitle>
                <CardDescription>
                  Track your spending patterns over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyExpenseData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyExpenseData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
                            return formatDate(istDate.toISOString());
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(Number(value))}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <RechartsTooltip 
                          formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                          labelFormatter={(label) => {
                            const d = new Date(label);
                            const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
                            return formatDate(istDate.toISOString());
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3b82f6" 
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <LineChartIcon className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No expense data available for the selected period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. Actual Spending</CardTitle>
                <CardDescription>
                  Compare your actual spending against your budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetVsActualData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVsActualData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                        <RechartsTooltip
                          formatter={(value) => [formatCurrency(Number(value)), ""]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="budget" 
                          name="Budget" 
                          fill="rgba(120, 120, 250, 0.2)" 
                        />
                        <Bar 
                          dataKey="spent" 
                          name="Actual" 
                          fill="rgba(30, 70, 230, 0.8)" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BarChart2 className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No budget data available for comparison
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
