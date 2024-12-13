import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/Toast';

export default function App() {
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