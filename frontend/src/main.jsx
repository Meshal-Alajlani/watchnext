import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './App.jsx';
import { AppProviders } from './AppProviders.jsx';
import { createServices } from './services/createServices.js';

// Created once at startup and handed to the app through context.
const services = createServices();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProviders services={services}>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
