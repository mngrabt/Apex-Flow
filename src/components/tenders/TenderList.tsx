import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '../../store/request';
import { useAuthStore } from '../../store/auth';
import { useTenderStore } from '../../store/tender';
import { Request, Tender } from '../../types';
import { AlertTriangle, X, FileText, GalleryVerticalEnd } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// Add keyframes for orange pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-orange {
    0%, 100% { background-color: rgb(249 115 22 / 0.1); }
    50% { background-color: rgb(249 115 22 / 0.2); }
  }
  .animate-pulse-orange {
    animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
document.head.appendChild(style);

interface TenderListProps {
  tenders: Tender[];
}

export default function TenderList({ tenders }: TenderListProps) {
  const navigate = useNavigate();
  const requests = useRequestStore((state) => state.requests);
  const user = useAuthStore((state) => state.user);
  const { deleteTender } = useTenderStore();

  // Sort tenders by creation date (newest first)
  const sortedTenders = [...tenders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getRequestName = (request: Request | undefined) => {
    if (!request) return 'Unnamed Request';
    
    // Only transfer requests can have tenders
    if (request.type === 'transfer' && request.items[0]) {
      return request.items[0].name;
    }
    return request.number || 'Unnamed Request';
  };

  const getDaysLeft = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const totalDays = 5; // Total days for tender
    const daysPassed = differenceInDays(now, created);
    const daysLeft = Math.max(0, totalDays - daysPassed);
    return daysLeft;
  };

  if (sortedTenders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-30rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <GalleryVerticalEnd className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Нет активных тендеров
          </p>
        </div>
      </div>
    );
  }

  const handleDeleteTender = async (e: React.MouseEvent, tenderId: string) => {
    e.stopPropagation();
    try {
      await deleteTender(tenderId);
    } catch (error) {
      console.error('Error deleting tender:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {sortedTenders.map((tender) => {
        const request = requests.find((r) => r.id === tender.requestId);
        const requestName = getRequestName(request);
        const daysLeft = getDaysLeft(tender.createdAt);

        return (
          <div
            key={tender.id}
            onClick={() => navigate(`/tenders/${tender.id}`)}
            className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer h-fit"
          >
            {/* Content */}
            <div className="relative space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 min-w-0 flex-1 pr-4">
                    <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                      {requestName}
                    </h3>
                    {request?.items?.[0]?.description && (
                      <p className="text-sm text-gray-500 break-words">
                        {request.items[0].description}
                      </p>
                    )}
                    {!request && (
                      <p className="text-xs text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Заявка не найдена
                      </p>
                    )}
                  </div>
                  {user?.id === '00000000-0000-0000-0000-000000000001' && (
                    <button
                      onClick={(e) => handleDeleteTender(e, tender.id)}
                      aria-label="Удалить тендер"
                      className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 
                               rounded-xl transition-colors ml-4 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info Blocks */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {tender.suppliers?.length || 0}/10
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Участников тендера</div>
                </div>
                <div className={`rounded-2xl p-4 text-center ${daysLeft <= 2 ? 'animate-pulse-orange' : 'bg-gray-50'}`}>
                  <div className={`text-sm font-medium ${daysLeft === 0 ? 'text-red-500' : daysLeft <= 2 ? 'text-orange-500' : 'text-gray-900'}`}>
                    {daysLeft}{' '}
                    {(() => {
                      if (daysLeft === 1) return 'день';
                      if (daysLeft >= 2 && daysLeft <= 4) return 'дня';
                      return 'дней';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">До завершения</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(tender.createdAt), 'dd.MM.yy')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Создан</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}