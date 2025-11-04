import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableAnalytics, sendInitialPageView } from './lib/analytics.ts'
import './index.css'
import App from './App.tsx'

// Initialize the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Enable analytics and send initial page view
enableAnalytics().then(() => {
  console.log('Google Analytics initialized');
  // Send initial page view after a short delay to ensure the app has rendered
  setTimeout(() => {
    sendInitialPageView();
  }, 100);
}).catch((err) => {
  console.warn('Google Analytics initialization failed:', err);
});
