import { useState, useEffect } from 'react';
import { useProtocolStore } from '../store/protocol';
import { useAuthStore } from '../store/auth';
import ProtocolList from '../components/protocols/ProtocolList';
import { Navigate } from 'react-router-dom';
import { hasAccess } from '../utils/accessControl';
import { styles } from '../utils/styleConstants';
import { AlertTriangle } from 'lucide-react';

export default function Protocols() {
  const user = useAuthStore((state) => state.user);
  const { protocols, fetchProtocols } = useProtocolStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProtocols = async () => {
      try {
        await fetchProtocols();
      } catch (error) {
        console.error('Error loading protocols:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProtocols();
  }, [fetchProtocols]);

  if (!user || !hasAccess(user.id, '/protocols')) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка протоколов...</p>
        </div>
      </div>
    );
  }

  const activeProtocols = protocols.filter(p => 
    p.type !== 'cash' && 
    p.status !== 'completed' && 
    p.status !== 'archived'
  );

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Протоколы
            </h1>
            <p className="mt-1 text-sm text-gray-500">
            {activeProtocols.length}{' '}
            {(() => {
              const count = activeProtocols.length;
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

      <ProtocolList protocols={protocols} />
    </div>
  );
}