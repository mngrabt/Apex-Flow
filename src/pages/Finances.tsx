import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFinanceStore } from '../store/finance';
import { styles } from '../utils/styleConstants';
import FinanceList from '../components/finances/FinanceList';
import FinanceHeader from '../components/finances/FinanceHeader';
import UrgencyModal from '../components/finances/UrgencyModal';
import { Protocol } from '../types';

interface ContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Finances() {
  const [view, setView] = useState<'not_submitted' | 'waiting' | 'paid'>('not_submitted');
  const [submittingProtocolId, setSubmittingProtocolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { protocols, fetchProtocols, submitProtocol, markAsPaid } = useFinanceStore();
  const { searchQuery } = useOutletContext<ContextType>();

  const { hasNotSubmitted, hasWaiting, hasPaid } = useMemo(() => ({
    hasNotSubmitted: protocols.some(p => !p.submittedAt),
    hasWaiting: protocols.some(p => p.submittedAt && !p.paidAt),
    hasPaid: protocols.some(p => p.paidAt)
  }), [protocols]);

  const getProtocolName = useCallback((protocol: Protocol) => {
    if (protocol.type === 'cash' && protocol.request?.items?.[0]) {
      return protocol.request.items[0].name;
    }
    
    if (protocol.type === 'tender' && protocol.tender?.request?.items?.[0]) {
      return protocol.tender.request.items[0].name;
    }
    
    return 'Неизвестная заявка';
  }, []);

  const handleSubmit = useCallback(async (protocolId: string) => {
    setSubmittingProtocolId(protocolId);
  }, []);

  const handleUrgencySubmit = useCallback(async (id: string, urgency: 'high' | 'low') => {
    try {
      await submitProtocol(id, urgency);
      await fetchProtocols();
      setSubmittingProtocolId(null);
      setView('waiting');
    } catch (error) {
      console.error('Error submitting protocol:', error);
    }
  }, [submitProtocol, fetchProtocols]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProtocols();
      } catch (error) {
        console.error('Error loading finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchProtocols]);

  useEffect(() => {
    if (!protocols.length) return;
    
    // Only auto-switch if there are no protocols in the current view
    const hasProtocolsInCurrentView = (
      (view === 'not_submitted' && hasNotSubmitted) ||
      (view === 'waiting' && hasWaiting) ||
      (view === 'paid' && hasPaid)
    );

    if (!hasProtocolsInCurrentView) {
      if (hasNotSubmitted) {
        setView('not_submitted');
      } else if (hasWaiting) {
        setView('waiting');
      } else if (hasPaid) {
        setView('paid');
      }
    }
  }, [protocols.length, hasNotSubmitted, hasWaiting, hasPaid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка финансов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.padding.section}`}>
      <FinanceHeader
        view={view}
        onViewChange={setView}
        hasNotSubmitted={hasNotSubmitted}
        hasWaiting={hasWaiting}
        hasPaid={hasPaid}
      />

      <FinanceList
        protocols={protocols}
        view={view}
        getProtocolName={getProtocolName}
        onSubmit={handleSubmit}
        onPaid={markAsPaid}
        searchQuery={searchQuery}
      />

      {submittingProtocolId && (
        <UrgencyModal
          protocolId={submittingProtocolId}
          onSubmit={handleUrgencySubmit}
          onClose={() => setSubmittingProtocolId(null)}
        />
      )}
    </div>
  );
}