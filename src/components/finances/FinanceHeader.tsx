import { styles } from '../../utils/styleConstants';
import { useFinanceStore } from '../../store/finance';

interface FinanceHeaderProps {
  view: 'not_submitted' | 'waiting' | 'paid';
  onViewChange: (view: 'not_submitted' | 'waiting' | 'paid') => void;
  hasNotSubmitted: boolean;
  hasWaiting: boolean;
  hasPaid: boolean;
}

export default function FinanceHeader({ 
  view, 
  onViewChange, 
  hasNotSubmitted,
  hasWaiting,
  hasPaid 
}: FinanceHeaderProps) {
  const protocols = useFinanceStore((state) => state.protocols);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Финансы
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {protocols.length}{' '}
              {(() => {
                const count = protocols.length;
                const lastDigit = count % 10;
                const lastTwoDigits = count % 100;

                if (count === 0) return 'протоколов';
                if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'протоколов';
                if (lastDigit === 1) return 'протокол';
                if (lastDigit >= 2 && lastDigit <= 4) return 'протокола';
                return 'протоколов';
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <nav className="bg-gray-50/80 rounded-xl p-1.5">
          <div className="flex items-center gap-1">
            {hasNotSubmitted && (
              <button
                onClick={() => onViewChange('not_submitted')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                  ${view === 'not_submitted' 
                    ? 'text-gray-700 bg-white' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                <span className="relative">На рассмотрение</span>
              </button>
            )}
            
            {hasWaiting && (
              <button
                onClick={() => onViewChange('waiting')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                  ${view === 'waiting' 
                    ? 'text-gray-700 bg-white' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                <span className="relative">На оплате</span>
              </button>
            )}
            
            {hasPaid && (
              <button
                onClick={() => onViewChange('paid')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                  ${view === 'paid' 
                    ? 'text-gray-700 bg-white' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                <span className="relative">Оплачены</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}