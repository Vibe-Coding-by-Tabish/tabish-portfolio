import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App';
import { initLiquidGlass } from './liquidGlass';
import { SITE_URL } from './pageMeta';

initLiquidGlass();

// Analytics only on the live site: its script (/_vercel/insights) exists only
// on Vercel, and local runs and preview deployments shouldn't count as visits
const isLiveSite = window.location.origin === SITE_URL;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {isLiveSite && <Analytics />}
  </StrictMode>
);
