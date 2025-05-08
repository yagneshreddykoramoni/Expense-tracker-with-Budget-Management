import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SidebarProvider } from "@/components/sidebar/SidebarContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { NotificationProvider } from '@/context/NotificationContext';
import Layout from "@/components/Layout";

import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "expenses", element: <Expenses /> },
      { path: "budgets", element: <Budgets /> },
      { path: "reports", element: <Reports /> },
      { path: "*", element: <NotFound /> }
    ]
  }
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ExpenseProvider>
        <NotificationProvider>
      <SidebarProvider>
        <RouterProvider router={router} />
      </SidebarProvider>
        </NotificationProvider>
      </ExpenseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
