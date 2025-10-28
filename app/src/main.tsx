import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableAnalytics } from './lib/analytics.ts'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

enableAnalytics()
