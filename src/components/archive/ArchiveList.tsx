import { PackageSearch } from 'lucide-react';
import { ArchivedProtocol, Request, Tender } from '../../types';
import ArchiveListItem from './list/ArchiveListItem';
import { useNavigate } from 'react-router-dom';

interface ArchiveListProps {
  protocols: ArchivedProtocol[];
  searchQuery?: string;
  requests: Request[];
  tenders: Tender[];
  view: 'protocols' | 'cash';
}

export default function ArchiveList({ 
  protocols, 
  searchQuery = '',
  requests,
  tenders,
  view
}: ArchiveListProps) {
  const navigate = useNavigate();

  const getRequestName = (protocol: ArchivedProtocol) => {
    // For cash requests, get name directly from the request
    if (protocol.type === 'cash' && protocol.request?.items[0]) {
      return protocol.request.items[0].name;
    }
    
    // For tender protocols, get name from the tender's request
    if (protocol.tender?.request?.items[0]) {
      return protocol.tender.request.items[0].name;
    }
    
    return 'Неизвестная заявка';
  };

  // Search filtering
  const filteredProtocols = protocols.filter(protocol => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = getRequestName(protocol).toLowerCase();
    const number = (protocol.number || '').toLowerCase();
    return name.includes(query) || number.includes(query);
  });

  // Sort protocols by creation date (newest first)
  const sortedProtocols = [...filteredProtocols].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedProtocols.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-22rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <PackageSearch className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            {filteredProtocols.length === 0 
              ? 'Архив пуст' 
              : 'Нет протоколов по вашему запросу'}
          </p>
        </div>
      </div>
    );
  }

  const handleProtocolClick = (protocol: ArchivedProtocol) => {
    if (protocol.type === 'cash' && protocol.request) {
      navigate(`/cash-requests/${protocol.request.id}`, {
        state: { from: 'archive', view }
      });
    } else {
      navigate(`/protocols/${protocol.id}`, {
        state: { from: 'archive', view }
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
      {sortedProtocols.map((protocol) => (
        <ArchiveListItem
          key={protocol.id}
          protocol={protocol}
          requestName={getRequestName(protocol)}
          onClick={() => handleProtocolClick(protocol)}
        />
      ))}
    </div>
  );
}