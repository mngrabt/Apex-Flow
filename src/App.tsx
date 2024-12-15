import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/Toast';
import { startCronJobs } from './services/cronService';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';

export default function App() {
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    // Only start cron jobs if user is logged in
    if (user) {
      startCronJobs();
    }
  }, [user]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}