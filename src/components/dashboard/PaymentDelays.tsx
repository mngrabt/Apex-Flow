import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProtocolStore } from '../../store/protocol';
import { differenceInDays } from 'date-fns';

export default function PaymentDelays() {
  const navigate = useNavigate();
  const { protocols } = useProtocolStore();

  // Filter protocols that are submitted but not paid for 5 or more days
  const delayedProtocols = protocols
    .filter(protocol => {
      if (protocol.financeStatus !== 'submitted' || !protocol.submittedAt) return false;
      const waitingDays = differenceInDays(new Date(), new Date(protocol.submittedAt));
      return waitingDays >= 5;
    })
    .slice(0, 3);

  if (delayedProtocols.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 uppercase tracking-wide">
          Задержки по оплате
        </h2>
        <button
          onClick={() => navigate('/finances')}
          className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wide"
        >
          Все
        </button>
      </div>

      {/* Delays List */}
      <div className="space-y-2">
        {delayedProtocols.map(protocol => {
          const waitingDays = differenceInDays(new Date(), new Date(protocol.submittedAt!));
          
          return (
            <div
              key={protocol.id}
              onClick={() => navigate(`/finances/${protocol.id}`)}
              className="group relative overflow-hidden bg-gray-50/80 backdrop-blur rounded-lg p-2.5
                       hover:bg-white hover:shadow-sm transform hover:scale-[1.01]
                       transition-all duration-300 cursor-pointer"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                           group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs text-gray-900 truncate">
                    {protocol.type === 'tender' 
                      ? protocol.tender?.request?.items[0]?.name
                      : protocol.request?.items[0]?.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ожидает оплаты {waitingDays} {waitingDays === 1 ? 'день' : 'дней'}
                  </p>
                </div>
                <div className="ml-2">
                  <div className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase
                    ${protocol.urgency === 'high' 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-yellow-50 text-yellow-600'}
                  `}>
                    {protocol.urgency === 'high' ? 'Срочно' : 'Не срочно'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}