import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeUsers } from './utils/initSupabase';

// Initialize Supabase with predefined users only if needed
initializeUsers()
  .then(() => console.log('User initialization check complete'))
  .catch(error => console.error('User initialization check failed:', error));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);