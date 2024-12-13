import { useAuthStore } from '../store/auth';
import { Search } from 'lucide-react';

interface HeaderProps {
  children?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ children, searchQuery, onSearchChange }: HeaderProps) {
  const { user, switchUser } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center flex-1 min-w-0 space-x-4">
          {children}
          
          {onSearchChange && (
            <div className="relative flex-1">
              <div className="relative -ml-[30px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Поиск по названию или категории..."
                  className="w-full pl-11 pr-4 py-2 bg-transparent
                           text-sm text-gray-900 placeholder-gray-400 
                           border-0 outline-none focus:outline-none focus:ring-0
                           transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>

        {onSearchChange && (
          <div className="mx-4 h-8 w-px bg-gray-200/50" />
        )}

        <div className="flex items-center">
          <button 
            onClick={switchUser}
            className="flex items-center px-4 py-2 rounded-xl hover:bg-gray-50/80 
                     transition-all duration-200 group"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                {user?.name || ''}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-primary/80 transition-colors">
                {user?.displayRole || 'Подрядчик'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}