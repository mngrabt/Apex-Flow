import { useLocation } from 'react-router-dom';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const location = useLocation();

  // Default loading messages based on route
  const getDefaultMessage = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/':
        return 'Загрузка данных...';
      case '/tasks':
        return 'Загрузка задач...';
      case '/requests':
        return 'Загрузка заявок...';
      case '/tenders':
        return 'Загрузка тендеров...';
      case '/protocols':
        return 'Загрузка протоколов...';
      case '/finances':
        return 'Загрузка финансов...';
      case '/database':
        return 'Загрузка базы данных...';
      case '/calendar':
        return 'Загрузка календаря...';
      case '/archive':
        return 'Загрузка архива...';
      case '/applications':
        return 'Загрузка заявлений...';
      default:
        if (path.startsWith('/tenders/')) {
          return 'Загрузка тендера...';
        }
        return 'Загрузка...';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">
          {message || getDefaultMessage()}
        </p>
      </div>
    </div>
  );
} 