import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './dashboard-mobile.css';
import './pos-mobile.css';
import './pos-cart-v3.css';
import { installStartupFallback } from './startup-fallback';
import { injectSpeedInsights } from '@vercel/speed-insights';

installStartupFallback();

// Inject Vercel Speed Insights
injectSpeedInsights();

const root = document.getElementById('root');
if (!root) throw new Error('SOM root element is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
