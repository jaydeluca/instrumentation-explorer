import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { withFaroRouterInstrumentation, initializeFaro, createReactRouterV6DataOptions, ReactIntegration, getWebInstrumentations, } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { matchRoutes } from 'react-router-dom';

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
], { basename: '/instrumentation-explorer/' }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

