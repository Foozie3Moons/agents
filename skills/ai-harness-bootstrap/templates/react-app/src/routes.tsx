import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layouts/AppShell.js';
import { HomePage } from './pages/HomePage.js';

// The only file besides main.tsx that may import router constructors (ESLint).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
