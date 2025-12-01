import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeConsentMode } from './lib/analytics.ts'
import './index.css'
import App from './App.tsx'

// Initialize consent mode FIRST (before any tracking)
// This sets default consent to 'denied' for GDPR compliance
initializeConsentMode();

// Render the app immediately
// Analytics script will only load after user gives consent via Cookie Banner
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
