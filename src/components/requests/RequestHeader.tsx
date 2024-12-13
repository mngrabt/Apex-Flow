import { Plus } from 'lucide-react';
import { styles } from '../../utils/styleConstants';
import { useRequestStore } from '../../store/request';

interface RequestHeaderProps {
  onCreateRequest: () => void;
  canCreateRequest: boolean;
}

export default function RequestHeader({ onCreateRequest, canCreateRequest }: RequestHeaderProps) {
  const requests = useRequestStore((state) => state.requests);
  
  const REQUIRED_SIGNATURES = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
  ];

  const activeRequests = requests.filter(request => 
    request.items && 
    request.items.length > 0 && 
    !['tender', 'protocol', 'archived'].includes(request.status) &&
    !REQUIRED_SIGNATURES.every(requiredId => 
      request.signatures.some(sig => sig.userId === requiredId)
    )
  );

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Заявки
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeRequests.length} {activeRequests.length === 1 ? 'заявка' : 'заявок'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {canCreateRequest && (
          <button
            onClick={onCreateRequest}
            className={styles.components.buttonPrimary}
          >
            <Plus className="h-5 w-5 mr-2" />
            Новая заявка
          </button>
        )}
      </div>
    </div>
  );
} 