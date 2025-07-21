import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import LibraryDetail from './LibraryDetail.tsx';
import JarAnalyzerPage from './JarAnalyzerPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/library/:version/:libraryName',
    element: <LibraryDetail />,
  },
  {
    path: '/analyze',
    element: <JarAnalyzerPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

