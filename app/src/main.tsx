import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableAnalytics } from './lib/analytics.ts'
import './index.css'
import App from './App.tsx'

// Initialize analytics before rendering the app
enableAnalytics().then(() => {
  console.log('Google Analytics initialized successfully');
  
  // Now render the app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}).catch((err) => {
  console.error('Google Analytics initialization failed:', err);
  
  // Still render the app even if analytics fails
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
