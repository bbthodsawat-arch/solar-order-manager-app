import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installStartupFallback } from './startup-fallback';

installStartupFallback();

const root = document.getElementById('root');
if (!root) throw new Error('SOM root element is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
