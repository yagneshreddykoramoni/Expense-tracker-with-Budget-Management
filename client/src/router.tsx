import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
// ...other imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ...your routes
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});