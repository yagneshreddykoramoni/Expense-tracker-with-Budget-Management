import { NavLink } from 'react-router-dom';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Tag,
  Bell,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotification } from '@/context/NotificationContext';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatTime } from '@/lib/utils';

interface Category {
  _id: string;
  name: string;
  color: string;
}

const Sidebar = () => {
  const { isOpen, toggle } = useSidebar();
  const { toast } = useToast();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotification();
  const [newCategory, setNewCategory] = useState({ name: '', color: '#000000' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const storedSettings = localStorage.getItem('notificationSettings');
    return storedSettings ? JSON.parse(storedSettings) : {
    budgetAlerts: true,
    expenseAlerts: true,
    weeklyReports: false
    };
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/categories`);
      setCategories(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/categories`, newCategory);
      toast({
        title: "Category Added",
        description: `Successfully added ${newCategory.name} category`,
      });
      setNewCategory({ name: '', color: '#000000' });
      fetchCategories(); // Refresh categories list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/categories/${categoryToDelete._id}`);
      toast({
        title: "Category Deleted",
        description: `Successfully deleted ${categoryToDelete.name} category`,
      });
      setCategoryToDelete(null);
      fetchCategories(); // Refresh categories list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleNotificationSettingsChange = (setting: string) => {
    setNotificationSettings(prev => {
      const updated = {
      ...prev,
      [setting]: !prev[setting]
      };
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(updated));
      return updated;
    });
    
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved",
    });
  };

const navItems = [
  { 
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/'
    },
    {
      title: 'Expenses',
      icon: <Receipt className="h-5 w-5" />,
      href: '/expenses'
    },
    {
      title: 'Budgets',
      icon: <Wallet className="h-5 w-5" />,
      href: '/budgets'
    },
    {
      title: 'Reports',
      icon: <BarChart2 className="h-5 w-5" />,
      href: '/reports'
    }
  ];

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-full flex-col border-r bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          {isOpen && <span className="text-xl font-semibold">CashWise</span>}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-medium text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground">No notifications</p>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => clearAll()}>
                          Clear all
                        </Button>
                      </div>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read ? 'bg-background' : 'bg-muted'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            onClick={toggle}
          >
            {isOpen ? (
                <ChevronLeft className="h-6 w-6" />
            ) : (
                <ChevronRight className="h-6 w-6" />
            )}
            </Button>
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-3 py-4">
            {navItems.map((item) => (
                <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors',
                    isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
                >
              {React.cloneElement(item.icon, { className: 'h-6 w-6' })}
              {isOpen && <span className="ml-3">{item.title}</span>}
                </NavLink>
            ))}
        </nav>

        <div className="border-t p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start py-3 text-base',
                  !isOpen && 'justify-center'
                )}
              >
                <Settings className="h-6 w-6" />
                {isOpen && <span className="ml-3">Settings</span>}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-xl">Settings</SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="categories" className="mt-6">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="categories" className="text-base">Categories</TabsTrigger>
                  <TabsTrigger value="notifications" className="text-base">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="categories" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name" className="text-base">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-color" className="text-base">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="w-14 h-11 p-1"
                        />
                        <Input
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="flex-1 h-11 text-base"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full h-11 text-base">
                      Add Category
                    </Button>

                    <div className="mt-6 space-y-2">
                      <Label className="text-base">Existing Categories</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {categories.map((category) => (
                          <div
                            key={category._id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-base">{category.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive"
                              onClick={() => setCategoryToDelete(category)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="notifications" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Label className="text-base">Budget Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you reach budget limits
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.budgetAlerts}
                        onCheckedChange={() => handleNotificationSettingsChange('budgetAlerts')}
                        className="h-6 w-11"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Label className="text-base">Expense Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified for new expenses
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.expenseAlerts}
                        onCheckedChange={() => handleNotificationSettingsChange('expenseAlerts')}
                        className="h-6 w-11"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Label className="text-base">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly expense summaries
                        </p>
            </div>
                      <Switch
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={() => handleNotificationSettingsChange('weeklyReports')}
                        className="h-6 w-11"
                      />
              </div>
          </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone and will remove this category from all expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default Sidebar;
