import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Temporarily disable StrictMode to prevent double renders causing auto-refresh issues
// StrictMode can be re-enabled after resolving the auth refresh issues
createRoot(document.getElementById('root')!).render(
  <App />
)
