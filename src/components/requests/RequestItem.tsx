import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Request } from '../../types';
import RequestInfoBlocks from './RequestInfoBlocks';
import RequestSignatures from './RequestSignatures';

interface RequestItemProps {
  request: Request;
  onDelete: (id: string) => void;
  onSign: (id: string) => void;
  canDelete: boolean;
  canSign: boolean;
  isSigningId: string | null;
}

export default function RequestItem({
  request,
  onDelete,
  onSign,
  canDelete,
  canSign,
  isSigningId
}: RequestItemProps) {
  const item = request.items[0];
  if (!item) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yy');
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <p className="text-gray-500 font-semibold">{item.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400 font-bold">
              {formatDate(request.createdAt)}
            </span>
            {canDelete && (
              <button
                onClick={() => onDelete(request.id)}
                aria-label="Удалить заявку"
                className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <RequestInfoBlocks item={item} documentUrl={request.documentUrl} />
        <RequestSignatures 
          request={request}
          canSign={canSign}
          isSigningId={isSigningId}
          onSign={onSign}
        />
      </div>
    </div>
  );
}