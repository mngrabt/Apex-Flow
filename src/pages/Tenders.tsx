import { useState, useEffect } from 'react';
import { useTenderStore } from '../store/tender';
import { useAuthStore } from '../store/auth';
import { useSupplierApplicationStore } from '../store/supplierApplication';
import { useRequestStore } from '../store/request';
import TenderList from '../components/tenders/TenderList';
import { Navigate } from 'react-router-dom';
import { hasAccess } from '../utils/accessControl';
import { GalleryVerticalEnd, RefreshCw } from 'lucide-react';
import { styles } from '../utils/styleConstants';

export default function Tenders() {
  const user = useAuthStore((state) => state.user);
  const { tenders, fetchTenders } = useTenderStore();
  const { applications, fetchApplications } = useSupplierApplicationStore();
  const { requests, fetchRequests } = useRequestStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await Promise.all([
          fetchTenders(),
          fetchRequests(),
          user?.role === 'S' ? fetchApplications() : Promise.resolve()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load tenders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchTenders, fetchRequests, fetchApplications, user?.role]);

  if (!user || !hasAccess(user.id, '/tenders')) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка тендеров...</p>
        </div>
      </div>
    );
  }

  // Get supplier categories if user is a supplier
  const supplierCategories = user.role === 'S'
    ? applications.find(app => app.username === user.username && app.status === 'approved')?.categories || []
    : [];

  // Filter active tenders
  let activeTenders = tenders.filter(tender => tender.status === 'active');

  // For supplier users, only show tenders that match their categories
  if (user.role === 'S') {
    activeTenders = activeTenders.filter(tender => {
      const request = requests.find(r => r.id === tender.requestId);
      return request?.categories?.some(category => supplierCategories.includes(category));
    });
  }

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Тендеры
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeTenders.length} {activeTenders.length === 1 ? 'активный тендер' : 'активных тендеров'}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-30rem)]">
          <div className="text-center space-y-4">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                loadData().finally(() => setIsLoading(false));
              }}
              className="text-sm text-primary hover:underline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      ) : activeTenders.length > 0 ? (
        <TenderList tenders={activeTenders} />
      ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
              <GalleryVerticalEnd className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Нет активных тендеров
            </p>
          </div>
        </div>
      )}
    </div>
  );
}