import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCcw, Send } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleReport = async () => {
    // Here you can implement error reporting logic
    // For example, sending to your error tracking service
    console.log('Error reported:', this.state.error);
    alert('Спасибо за сообщение об ошибке! Мы исправим её как можно скорее.');
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorPage 
        error={this.state.error} 
        onRefresh={this.handleRefresh}
        onReport={this.handleReport}
      />;
    }

    return this.props.children;
  }
}

interface ErrorPageProps {
  error: Error | null;
  onRefresh: () => void;
  onReport: () => void;
}

function ErrorPage({ error, onRefresh, onReport }: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h1 className="text-lg font-semibold">Произошла ошибка</h1>
          </div>
          <p className="text-sm text-red-600">
            К сожалению, произошла непредвиденная ошибка. Мы уже работаем над её устранением.
          </p>
        </div>

        {/* Error Details */}
        <div className="p-6 border-b border-gray-100">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-1">
                Техническая информация
              </h2>
              <pre className="p-4 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono overflow-auto">
                {error?.message || 'Unknown error'}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center
                     bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium
                     hover:bg-gray-50 active:bg-gray-100
                     transition-colors duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            На главную
          </button>
          <button
            onClick={onRefresh}
            className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center
                     bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium
                     hover:bg-gray-50 active:bg-gray-100
                     transition-colors duration-200"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Обновить страницу
          </button>
          <button
            onClick={onReport}
            className="w-full sm:w-auto h-10 px-4 inline-flex items-center justify-center
                     bg-primary text-white rounded-lg text-sm font-medium
                     hover:bg-primary/90 active:bg-primary/80
                     transition-colors duration-200 ml-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            Сообщить об ошибке
          </button>
        </div>
      </div>
    </div>
  );
} 