import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useRequestStore } from '../store/request';
import { useTaskStore } from '../store/task';
import { useApplicationStore } from '../store/application';
import { useProtocolStore } from '../store/protocol';
import { useTenderStore } from '../store/tender';
import { useCalendarStore } from '../store/calendar';
import { useArchiveStore } from '../store/archive';
import { useSupplierApplicationStore } from '../store/supplierApplication';
import { supabase } from '../lib/supabase';
import {
  Home,
  ListTodo,
  FileText,
  GalleryVerticalEnd,
  ScrollText,
  Briefcase,
  Building2,
  CalendarDays,
  PackageSearch,
  ClipboardSignature,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { styles } from '../utils/styleConstants';
import { hasAccess } from '../utils/accessControl';
import { useState, useEffect } from 'react';

// Required signatures for requests
const REQUIRED_SIGNATURES = [
  '00000000-0000-0000-0000-000000000001', // Abdurauf
  '00000000-0000-0000-0000-000000000003', // Fozil
  '00000000-0000-0000-0000-000000000004', // Aziz
  '00000000-0000-0000-0000-000000000005'  // Umarali
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

export default function Sidebar({ isOpen, onClose, isDesktop }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, users } = useAuthStore(state => state);
  const logout = useAuthStore(state => state.logout);
  const tasks = useTaskStore(state => state.tasks);
  const requests = useRequestStore(state => state.requests);
  const applications = useApplicationStore(state => state.applications);
  const protocols = useProtocolStore(state => state.protocols);
  const tenders = useTenderStore(state => state.tenders);
  const { unscheduledEvents } = useCalendarStore();
  const { archivedProtocols } = useArchiveStore();
  const { applications: supplierApplications } = useSupplierApplicationStore();

  // Calculate counters
  const incompleteTasks = tasks.filter(task => !task.completedAt).length;
  
  // Calculate requests needing signature for current user
  const requestsNeedingSignature = requests.filter(request => {
    // Only count if user is logged in
    if (!user) return false;
    
    // Only count active requests
    if (request.status === 'completed' || request.status === 'archived' || request.status === 'tender' || request.status === 'protocol') {
      return false;
    }

    // Skip if user has already signed
    if (request.signatures.some(sig => sig.userId === user.id)) {
      return false;
    }

    // For Fozil and Aziz, show all unsigned requests
    if (user.id === '00000000-0000-0000-0000-000000000003' || // Fozil
        user.id === '00000000-0000-0000-0000-000000000004') { // Aziz
      return true;
    }

    return false;
  }).length;

  // Log final count
  console.log('Total requests needing signature:', requestsNeedingSignature);

  // Calculate protocols needing signature for current user
  const protocolsNeedingSignature = protocols.filter(protocol => {
    // Only count if user is logged in
    if (!user) return false;

    // Only count active protocols
    if (protocol.status === 'completed' || protocol.status === 'archived') {
      return false;
    }

    // Exclude cash requests
    if (protocol.type === 'cash') {
      return false;
    }

    // Check if user hasn't signed yet
    return !(protocol.signatures || []).some((sig: { userId: string }) => sig.userId === user.id);
  }).length;

  // Calculate finance counters
  const notSubmittedProtocols = protocols.filter(protocol => {
    // Only count protocols that are not submitted to finance
    if (protocol.financeStatus !== 'not_submitted') return false;
    
    // Exclude cash requests
    if (protocol.type === 'cash') return false;
    
    // Only count protocols that have all required signatures
    const hasAllSignatures = REQUIRED_SIGNATURES.every(requiredId => 
      protocol.signatures.some(sig => sig.userId === requiredId)
    );
    
    return hasAllSignatures;
  }).length;

  const waitingProtocols = protocols.filter(protocol => {
    return protocol.financeStatus === 'waiting';
  }).length;

  // Calculate active tenders count based on user role
  const activeTendersCount = (() => {
    if (!user) return 0;
    
    // Get active tenders
    const activeTenders = tenders.filter(tender => tender.status === 'active');
    
    // For supplier users, only count tenders that match their categories
    if (user.role === 'S') {
      const supplierCategories = supplierApplications.find(
        app => app.username === user.username && app.status === 'approved'
      )?.categories || [];
      
      return activeTenders.filter(tender => {
        const request = requests.find(r => r.id === tender.requestId);
        return request?.categories?.some(category => supplierCategories.includes(category));
      }).length;
    }
    
    // For other users, show all active tenders
    return activeTenders.length;
  })();

  const pendingApplications = supplierApplications?.filter(app => app.status === 'pending').length || 0;

  // Calculate protocols without numbers for archive tab
  const protocolsWithoutNumber = archivedProtocols.filter(protocol => !protocol.number).length;

  // Use unscheduled events count for calendar badge
  const unscheduledCount = unscheduledEvents?.length || 0;

  if (!user) return null;

  // Check for specific users
  const isSherzod = user.id === '00000000-0000-0000-0000-000000000009';
  const isDinara = user.id === '00000000-0000-0000-0000-000000000006';
  const isAkmal = user.id === '00000000-0000-0000-0000-000000000008';
  const isUmar = user.id === '00000000-0000-0000-0000-000000000007';

  // Determine logo click destination
  const logoDestination = isSherzod ? '/finances' 
    : isDinara ? '/archive'
    : isAkmal || isUmar ? '/calendar'
    : '/';

  // Should hide dashboard for these users and suppliers
  const shouldHideDashboard = isDinara || isSherzod || isAkmal || isUmar || user.role === 'S';

  const navigation: NavigationCategory[] = [
    {
      title: 'Основное',
      items: [
        // Dashboard button - hide for specific users and suppliers
        ...(shouldHideDashboard ? [] : [
          { 
            name: 'Главная', 
            href: '/', 
            icon: Home
          }
        ]),
        { 
          name: 'Задачи', 
          href: '/tasks', 
          icon: ListTodo,
          badge: incompleteTasks > 0 ? incompleteTasks : undefined
        },
        { 
          name: 'Заявки', 
          href: '/requests', 
          icon: FileText,
          badge: requestsNeedingSignature > 0 ? requestsNeedingSignature : undefined
        },
        { 
          name: 'Тендеры', 
          href: '/tenders', 
          icon: GalleryVerticalEnd,
          badge: activeTendersCount > 0 ? activeTendersCount : undefined
        },
        { 
          name: 'Протоколы', 
          href: '/protocols', 
          icon: ScrollText,
          badge: protocolsNeedingSignature > 0 ? protocolsNeedingSignature : undefined
        },
        { 
          name: 'Финансы', 
          href: '/finances', 
          icon: Briefcase,
          badge: user.id === '00000000-0000-0000-0000-000000000005' ? 
                 (notSubmittedProtocols > 0 ? notSubmittedProtocols : undefined) : // Umarali
                 user.id === '00000000-0000-0000-0000-000000000009' ? 
                 (waitingProtocols > 0 ? waitingProtocols : undefined) : // Sherzod
                 undefined
        }
      ].filter(item => hasAccess(user.id, item.href))
    },
    {
      title: 'Управление',
      items: [
        { 
          name: 'База данных', 
          href: '/database', 
          icon: Building2
        },
        { 
          name: 'Календарь', 
          href: '/calendar', 
          icon: CalendarDays,
          badge: unscheduledCount > 0 ? unscheduledCount : undefined
        },
        { 
          name: 'Архив', 
          href: '/archive', 
          icon: PackageSearch,
          badge: isDinara && protocolsWithoutNumber > 0 ? protocolsWithoutNumber : undefined
        }
      ].filter(item => hasAccess(user.id, item.href))
    },
    ...(user.role === 'S' ? [] : [
      {
        title: 'Проверка',
        items: [
          { 
            name: 'Заявления', 
            href: '/applications', 
            icon: ClipboardSignature,
            badge: pendingApplications > 0 ? pendingApplications : undefined
          }
        ].filter(item => hasAccess(user.id, item.href))
      }
    ])
  ].filter(category => category.items.length > 0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col h-screen
        border-r border-gray-100
        transition-transform duration-300 ease-in-out
        ${isDesktop ? 'relative translate-x-0' : !isOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex-none pt-5 px-5 pb-5">
          <Link 
            to={logoDestination}
            className="flex items-center"
            onClick={onClose}
          >
            <img
              src={`${supabase.storage.from('logos').getPublicUrl('horizontal.svg').data.publicUrl}`}
              alt="ApexFlow"
              className="h-9 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-4 space-y-8">
            {navigation.map((category) => (
              <div key={category.title} className="space-y-3">
                <h2 className="px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider opacity-100">
                  {category.title}
                </h2>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-xl
                          transition-all duration-200
                          ${isActive 
                            ? 'bg-primary text-white' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                          }
                        `}
                        onClick={onClose}
                      >
                        <item.icon className={`flex-shrink-0 h-5 w-5 ${
                          isActive 
                            ? 'text-white' 
                            : 'text-gray-400 group-hover:text-primary transition-colors'
                        }`} />
                        <span className="ml-3 flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={`
                            ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-primary/10 text-primary'
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-none p-2 border-t border-gray-100">
          <div className="flex items-center justify-between px-3">
            <a
              href="https://t.me/apexflowsupportbot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Поддержка"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
            <button
              onClick={handleLogout}
              aria-label="Выйти"
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}