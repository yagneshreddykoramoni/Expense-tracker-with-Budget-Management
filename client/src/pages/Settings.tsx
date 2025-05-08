import { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, User, Bell, Shield, CreditCard, Trash2 } from 'lucide-react';
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
import { useNotification } from '@/context/NotificationContext';

// Create a user profile context or use local storage
const getUserProfile = () => {
  const storedProfile = localStorage.getItem('userProfile');
  return storedProfile ? JSON.parse(storedProfile) : {
    name: 'John Doe',
    email: 'john@example.com',
    currency: 'USD'
  };
};

const Settings = () => {
  const { categories, addCategory, deleteCategory } = useExpense();
  const { toast } = useToast();
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3b82f6',
  });

  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Keep notification settings state for UI only
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const storedSettings = localStorage.getItem('notificationSettings');
    return storedSettings ? JSON.parse(storedSettings) : {
      budgetAlerts: true,
      expenseAlerts: true,
      weeklyReports: false
    };
  });

  const handleAddCategory = () => {
    try {
      if (!newCategory.name.trim()) {
        throw new Error('Please enter a category name');
      }
      
      const existingCategory = categories.find(
        c => c.name.toLowerCase() === newCategory.name.toLowerCase()
      );
      
      if (existingCategory) {
        throw new Error('Category already exists');
      }
      
      addCategory({
        name: newCategory.name.trim(),
        color: newCategory.color,
      });
      
      setNewCategory({
        name: '',
        color: '#3b82f6',
      });
      
      toast({
        title: 'Category added',
        description: 'Your new category has been added successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setCategoryToDelete(null);
    }
  };

  const handleProfileUpdate = () => {
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been updated successfully.'
    });
    
    // Force an update for sidebar and other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleNotificationSettingsChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      localStorage.setItem('notificationSettings', JSON.stringify(updated));
      return updated;
    });
    
    toast({
      title: 'Settings Updated',
      description: 'Your notification preferences have been saved',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="flex gap-1 items-center">
            <CreditCard className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex gap-1 items-center">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-1 items-center">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex gap-1 items-center">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage expense categories. Create new ones or delete existing categories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category-name">New Category Name</Label>
                  <Input
                    id="category-name"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-color">Category Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="category-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleAddCategory} className="gap-1">
                <Plus className="h-4 w-4" />
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
                        onClick={() => setCategoryToDelete(category._id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <Input 
                    id="currency" 
                    placeholder="USD" 
                    value={userProfile.currency}
                    onChange={(e) => setUserProfile({...userProfile, currency: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Budget Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when you approach your budget limits
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.budgetAlerts}
                    onCheckedChange={() => handleNotificationSettingsChange('budgetAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expense Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified for new expenses
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.expenseAlerts}
                    onCheckedChange={() => handleNotificationSettingsChange('expenseAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly expense summaries
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={() => handleNotificationSettingsChange('weeklyReports')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Password updated successfully' })}>Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              and may affect expenses associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
