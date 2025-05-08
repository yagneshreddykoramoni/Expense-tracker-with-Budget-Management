
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ExpenseProvider } from './context/ExpenseContext.tsx';

createRoot(document.getElementById("root")!).render(
  <ExpenseProvider>
    <App />
  </ExpenseProvider>
);
