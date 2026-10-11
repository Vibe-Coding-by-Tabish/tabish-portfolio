import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import Clarity from '@microsoft/clarity';
import './index.css';
import App from './App';
import { initLiquidGlass } from './liquidGlass';
import { SITE_URL } from './pageMeta';

initLiquidGlass();

// Analytics only on the live site: Vercel's script (/_vercel/insights) exists
// only there, and local runs and preview deployments shouldn't count as visits
const isLiveSite = window.location.origin === SITE_URL;

// Session recordings and heatmaps. The project ID comes from the Vercel
// environment variable VITE_CLARITY_ID; without it, Clarity stays off.
const clarityId = import.meta.env.VITE_CLARITY_ID;
if (isLiveSite && clarityId) Clarity.init(clarityId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {isLiveSite && <Analytics />}
  </StrictMode>
);
