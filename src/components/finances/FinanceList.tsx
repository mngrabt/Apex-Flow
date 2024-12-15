import { Protocol } from '../../types';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FinanceListItem from './list/FinanceListItem';

interface FinanceListProps {
  protocols: Protocol[];
  view: 'not_submitted' | 'waiting' | 'paid';
  getProtocolName: (protocol: Protocol) => string;
  onSubmit: (id: string) => void;
  onPaid: (id: string) => void;
  searchQuery?: string;
}

export default function FinanceList({
  protocols,
  view,
  getProtocolName,
  onSubmit,
  onPaid,
  searchQuery = ''
}: FinanceListProps) {
  const navigate = useNavigate();

  // Search filtering
  const filteredProtocols = protocols.filter(protocol => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = getProtocolName(protocol).toLowerCase();
    return name.includes(query);
  });

  // Filter protocols based on view
  const viewFilteredProtocols = filteredProtocols.filter(protocol => {
    switch (view) {
      case 'not_submitted':
        return !protocol.submittedAt;
      case 'waiting':
        return protocol.submittedAt && !protocol.paidAt;
      case 'paid':
        return protocol.paidAt;
      default:
        return true;
    }
  });

  // Sort protocols based on view
  const sortedProtocols = [...viewFilteredProtocols].sort((a, b) => {
    if (view === 'waiting') {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (a.urgency !== 'high' && b.urgency === 'high') return 1;
    }
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const handleProtocolClick = (protocol: Protocol) => {
    // For cash requests, use request ID, otherwise use protocol ID
    if (protocol.type === 'cash' && protocol.request) {
      navigate(`/cash-requests/${protocol.request.id}`, {
        state: { from: 'finances', view }
      });
    } else {
      navigate(`/protocols/${protocol.id}`, {
        state: { from: 'finances', view }
      });
    }
  };

  if (sortedProtocols.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            {filteredProtocols.length === 0 
              ? 'Нет активных протоколов' 
              : 'Нет активных протоколов по вашему запросу'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedProtocols.map((protocol) => (
        <FinanceListItem
          key={protocol.id}
          protocol={protocol}
          protocolName={getProtocolName(protocol)}
          view={view}
          onClick={() => handleProtocolClick(protocol)}
          onSubmit={onSubmit}
          onPaid={onPaid}
        />
      ))}
    </div>
  );
}