import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useRequestStore } from '../../store/request';
import { useTenderStore } from '../../store/tender';
import { Protocol } from '../../types';
import { Clock, ScrollText } from 'lucide-react';
import ProtocolListItem from './list/ProtocolListItem';

interface ProtocolListProps {
  protocols: Protocol[];
}

export default function ProtocolList({ protocols }: ProtocolListProps) {
  const navigate = useNavigate();
  const tenders = useTenderStore((state) => state.tenders);
  const requests = useRequestStore((state) => state.requests);
  const fetchTenders = useTenderStore((state) => state.fetchTenders);
  const fetchRequests = useRequestStore((state) => state.fetchRequests);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTenders();
    fetchRequests();
  }, [fetchTenders, fetchRequests, refreshKey]);

  const handleProtocolUpdate = () => {
    // Trigger a refresh by updating the key
    setRefreshKey(prev => prev + 1);
  };

  const getRequestName = (protocol: Protocol) => {
    // For cash protocols
    if (protocol.type === 'cash' && protocol.request?.items?.[0]) {
      return protocol.request.items[0].name;
    }

    // For tender protocols
    // First try to get name from linked tender's request items
    if (protocol.tender?.request?.items?.[0]?.name) {
      return protocol.tender.request.items[0].name;
    }

    // Then try to get name from tenders store
    const tender = tenders.find((t) => t.id === protocol.tenderId);
    if (tender) {
      const request = requests.find((r) => r.id === tender.requestId);
      if (request?.items?.[0]?.name) {
        return request.items[0].name;
      }
    }

    return 'Неизвестная заявка';
  };

  const handleProtocolClick = (protocol: Protocol) => {
    if (protocol.type === 'cash') {
      if (protocol.request?.id) {
        navigate(`/cash-requests/${protocol.request.id}/protocol`);
      }
    } else {
      navigate(`/protocols/${protocol.id}`);
    }
  };

  // Show all active protocols (not completed or archived)
  const activeProtocols = protocols
    .filter(p => 
      // Exclude cash requests and completed/archived protocols
      p.type !== 'cash' && 
      p.status !== 'completed' && 
      p.status !== 'archived'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (activeProtocols.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <ScrollText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Нет активных протоколов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
      {activeProtocols.map((protocol) => (
        <ProtocolListItem
          key={protocol.id}
          protocol={protocol}
          requestName={getRequestName(protocol)}
          onClick={() => handleProtocolClick(protocol)}
          onUpdate={handleProtocolUpdate}
        />
      ))}
    </div>
  );
}