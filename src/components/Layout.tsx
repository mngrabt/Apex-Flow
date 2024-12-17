import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { styles } from '../utils/styleConstants';

export default function Layout() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1620);
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1620;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only show search bar in specific routes and not in supplier details
  const showSearch = ['/applications', '/archive', '/finances'].includes(location.pathname) || 
    (location.pathname === '/database' && !location.state?.isSupplierDetails);

  if (!user) return null;

  // For suppliers (role S), redirect to tenders page if on root
  if (user.role === 'S' && location.pathname === '/') {
    return <Navigate to="/tenders" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className="flex-none">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => !isDesktop && setIsSidebarOpen(false)}
          isDesktop={isDesktop}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={showSearch ? searchQuery : undefined}
          onSearchChange={showSearch ? setSearchQuery : undefined}
        >
          {!isDesktop && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-primary/10 rounded-xl transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-500" />
              ) : (
                <Menu className="w-5 h-5 text-gray-500" />
              )}
            </button>
          )}
        </Header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className={styles.padding.page}>
            <Outlet context={{ searchQuery, setSearchQuery }} />
          </div>
        </main>
      </div>
    </div>
  );
}