import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '../../store/request';
import { Request, Tender } from '../../types';

interface TenderListProps {
  tenders: Tender[];
}

export default function TenderList({ tenders }: TenderListProps) {
  const navigate = useNavigate();
  const requests = useRequestStore((state) => state.requests);

  // Sort tenders by creation date (newest first)
  const sortedTenders = [...tenders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Take only first 3 tenders for dashboard
  const dashboardTenders = sortedTenders.slice(0, 3);

  const getRequestName = (request: Request | undefined) => {
    if (!request) return '';
    
    // Only transfer requests can have tenders
    if (request.type === 'transfer' && request.items[0]) {
      return request.items[0].name;
    }
    return '';
  };

  return (
    <div className={`relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-sm
                    ${dashboardTenders.length === 1 ? 'max-w-sm' : dashboardTenders.length === 2 ? 'max-w-sm' : 'max-w-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          АКТИВНЫЕ ТЕНДЕРЫ
        </h2>
        {sortedTenders.length > 3 && (
          <button
            onClick={() => navigate('/tenders')}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Показать все
          </button>
        )}
      </div>

      {/* Tenders List */}
      <div className="space-y-2">
        {dashboardTenders.map((tender) => {
          const request = requests.find(r => r.id === tender.requestId);
          const name = getRequestName(request);
          if (!name) return null;
          
          return (
            <div
              key={tender.id}
              onClick={() => navigate(`/tenders/${tender.id}`)}
              className="group relative overflow-hidden bg-gray-50/80 backdrop-blur rounded-xl p-3
                       hover:bg-white hover:shadow-lg transform hover:scale-[1.02]
                       transition-all duration-300 cursor-pointer"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                           group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                  {name}
                </h3>
              </div>
            </div>
          );
        })}

        {sortedTenders.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-xl bg-gray-50/80 backdrop-blur">
            <span className="text-xs text-gray-500 font-medium">Нет активных тендеров</span>
          </div>
        )}
      </div>
    </div>
  );
}