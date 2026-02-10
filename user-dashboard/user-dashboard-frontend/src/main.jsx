import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeSecurityFeatures, checkBrowserCapabilities } from './utils/environmentSecurity'
import { info, warn, error as logError } from './utils/logger'

// Initialize security features BEFORE anything else
try {
  const securityInit = initializeSecurityFeatures();
  const capabilities = checkBrowserCapabilities();
  
  info('Security initialization complete', { securityInit, capabilities });
} catch (err) {
  logError('Failed to initialize security features', err);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
