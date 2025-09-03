import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { withFaroRouterInstrumentation, initializeFaro, createReactRouterV6DataOptions, ReactIntegration, getWebInstrumentations, } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { matchRoutes } from 'react-router-dom';

// Handle GitHub Pages 404 redirect
// Check if we have a 'p' parameter which contains the original path
const urlParams = new URLSearchParams(window.location.search);
const redirectPath = urlParams.get('p');
if (redirectPath) {
  // Remove the 'p' parameter and reconstruct the URL
  urlParams.delete('p');
  const newSearch = urlParams.toString();
  const newUrl = redirectPath + (newSearch ? '?' + newSearch : '') + window.location.hash;
  window.history.replaceState(null, '', newUrl);
}

initializeFaro({
    url: 'https://faro-collector-prod-us-east-2.grafana.net/collect/40daccd6ee8227fd2eb316a9e81e7436',
    app: {
        name: 'Instrumentation Explorer (POC)',
        version: '1.0.0',
        environment: 'production'
    },

    instrumentations: [
        // Mandatory, omits default instrumentations otherwise.
        ...getWebInstrumentations(),

        // Tracing package to get end-to-end visibility for HTTP requests.
        new TracingInstrumentation(),

        // React integration for React applications.
        new ReactIntegration({
            router: createReactRouterV6DataOptions({
                matchRoutes,
            }),
        }),
    ],
});


import './index.css'
import App from './App.tsx'
import LibraryDetail from './LibraryDetail.tsx';
import JarAnalyzerPage from './JarAnalyzerPage.tsx';
import About from './About.tsx'; // Import the new About component
import { ThemeProvider } from './ThemeProvider'; // Import ThemeProvider


const router = withFaroRouterInstrumentation(createBrowserRouter([
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
  {
    path: '/about',
    element: <About />,
  },
], { basename: '/instrumentation-explorer/' }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider> {/* Wrap RouterProvider with ThemeProvider */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);

