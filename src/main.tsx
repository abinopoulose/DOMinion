import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BRANDING } from './config/branding'

// Apply branding configuration
document.title = BRANDING.title;
let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (favicon) {
  favicon.href = BRANDING.logoUrl;
} else {
  favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = BRANDING.logoUrl;
  document.head.appendChild(favicon);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
