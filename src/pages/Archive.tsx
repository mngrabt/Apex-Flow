import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useArchiveStore } from '../store/archive';
import { useRequestStore } from '../store/request';
import { useTenderStore } from '../store/tender';
import ArchiveDetails from '../components/archive/ArchiveDetails';
import ArchiveList from '../components/archive/ArchiveList';
import { Archive as ArchiveIcon } from 'lucide-react';
import { styles } from '../utils/styleConstants';

type ContextType = {
  searchQuery: string;
};

type ArchiveView = 'protocols' | 'cash';

export default function Archive() {
  const location = useLocation();
  const { archivedProtocols, fetchArchivedProtocols } = useArchiveStore();
  const { requests, fetchRequests } = useRequestStore();
  const { tenders, fetchTenders } = useTenderStore();
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [view, setView] = useState<ArchiveView>(
    (location.state?.view as ArchiveView) || 'protocols'
  );
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery } = useOutletContext<ContextType>();

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchArchivedProtocols(),
          fetchRequests(),
          fetchTenders()
        ]);
      } catch (error) {
        console.error('Error loading archive data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchArchivedProtocols, fetchRequests, fetchTenders]);

  // Set initial view based on available protocols
  useEffect(() => {
    if (!isLoading) {
      const hasProtocols = archivedProtocols.some(p => p.type !== 'cash');
      if (!hasProtocols) {
        setView('cash');
      }
    }
  }, [isLoading, archivedProtocols]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка архива...</p>
        </div>
      </div>
    );
  }

  // Check if we have any protocols for each view
  const hasProtocols = archivedProtocols.some(p => p.type !== 'cash');
  const hasCash = archivedProtocols.some(p => p.type === 'cash');

  if (selectedProtocolId) {
    return (
      <ArchiveDetails
        protocolId={selectedProtocolId}
        onBack={() => setSelectedProtocolId(null)}
      />
    );
  }

  // Filter protocols based on view
  const filteredProtocols = archivedProtocols.filter(protocol => {
    // First apply type filter
    if (view === 'protocols') {
      return protocol.type !== 'cash';
    } else {
      return protocol.type === 'cash';
    }
  });

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Архив
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {archivedProtocols.length}{' '}
              {(() => {
                const count = archivedProtocols.length;
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

      {/* View Toggle */}
      <div className="flex justify-center">
        <nav className="bg-gray-50/80 rounded-xl p-1.5">
          <div className="flex items-center gap-1">
            {hasProtocols && (
              <button
                onClick={() => setView('protocols')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                  ${view === 'protocols' 
                    ? 'text-gray-700 bg-white' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                <span className="relative">Протоколы</span>
              </button>
            )}
            
            {hasCash && (
              <button
                onClick={() => setView('cash')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                  ${view === 'cash' 
                    ? 'text-gray-700 bg-white' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
                  }`}
              >
                <span className="relative">Наличные</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Archive List */}
      <ArchiveList 
        protocols={filteredProtocols}
        searchQuery={searchQuery}
        requests={requests}
        tenders={tenders}
        view={view}
      />
    </div>
  );
}