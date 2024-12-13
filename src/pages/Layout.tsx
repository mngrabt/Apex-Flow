import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="h-6 w-6 text-gray-500" />
          </button>
        </Header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="p-4 md:p-6">
            <Outlet context={{ searchQuery, setSearchQuery }} />
          </div>
        </main>
      </div>
    </div>
  );
}