import { useAuthStore } from '../../store/auth';
import { useRequestStore } from '../../store/request';
import { useState } from 'react';
import { Request, TransferRequest, CashRequest } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Banknote, Package2, Clock, X, FileText, AlertTriangle } from 'lucide-react';

interface RequestListProps {
  requests: Request[];
}

interface InfoBlockProps {
  label: string;
  value: string;
}

const InfoBlock = ({ label, value }: InfoBlockProps) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center">
      <div className="text-sm font-medium text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
};

export default function RequestList({ requests }: RequestListProps) {
  const user = useAuthStore((state) => state.user);
  const { signRequest, deleteRequest } = useRequestStore();
  const [signingRequestId, setSigningRequestId] = useState<string | null>(null);

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

  const canSign = (request: Request) => {
    if (!user) return false;
    if (!['A', 'C'].includes(user.role)) return false;
    if (user.id === '00000000-0000-0000-0000-000000000001') return false;
    return !request.signatures.some((sig) => sig.userId === user.id);
  };

  const handleSignRequest = async (requestId: string) => {
    if (!user || signingRequestId || !requestId) return;
    try {
      setSigningRequestId(requestId);
      await signRequest(requestId, user.id);
    } catch (error) {
      console.error('Error signing request:', error);
    } finally {
      setSigningRequestId(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!requestId) return;
    try {
      await deleteRequest(requestId);
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  if (activeRequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Нет активных заявок
          </p>
        </div>
      </div>
    );
  }

  const renderRequest = (request: TransferRequest | CashRequest) => {
    const item = request.items[0];
    if (!item) return null;

    const isTransfer = request.type === 'transfer';
    const transferItem = isTransfer ? item : null;
    const cashItem = !isTransfer ? item : null;

    return (
      <div
        key={request.id}
        className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden h-fit"
      >
        {/* Content */}
        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2 min-w-0 flex-1 pr-4">
                <div className={`
                  inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  ${isTransfer ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}
                `}>
                  {isTransfer ? 'Перечисление' : 'Наличные'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500 break-words">{item.description}</p>
              </div>
              {user?.role === 'A' && request.id && (
                <button
                  onClick={() => handleDeleteRequest(request.id!)}
                  className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 
                           rounded-xl transition-colors ml-4 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Info Blocks */}
          <div className={`grid gap-4 ${isTransfer ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <InfoBlock
              label="Создан"
              value={formatDate(request.createdAt)}
            />
            <InfoBlock
              label={isTransfer ? "Количество" : "Сумма"}
              value={isTransfer && transferItem
                ? `${transferItem.quantity} ${transferItem.unitType}`
                : cashItem
                  ? `${cashItem.totalSum.toLocaleString()} сум`
                  : ''
              }
            />
            {isTransfer && (
              <InfoBlock
                label="Тип места"
                value={transferItem?.objectType === 'office' ? 'Офис' : 'Стройка'}
              />
            )}
          </div>

          {/* Signatures */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Подписи</h4>
            <div className="grid grid-cols-3 gap-4">
              {REQUIRED_SIGNATURES.map((userId) => {
                const signature = request.signatures.find((s) => s.userId === userId);
                const userName = getUserName(userId);
                
                return (
                  <div 
                    key={userId}
                    className="bg-gray-50 rounded-2xl p-4 text-center"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {signature ? formatDate(signature.date) : 'Не подписано'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          {canSign(request) && (
            <button
              onClick={() => handleSignRequest(request.id)}
              disabled={!!signingRequestId}
              className="bg-primary text-white rounded-2xl p-4 text-center w-full
                       hover:bg-primary/90 transition-all cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-sm font-medium"
            >
              {signingRequestId === request.id ? 'Подписание...' : 'Подписать'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {activeRequests.map((request) => renderRequest(request as TransferRequest | CashRequest))}
    </div>
  );
}

function getUserName(userId: string) {
  switch (userId) {
    case '00000000-0000-0000-0000-000000000001':
      return 'Абдурауф';
    case '00000000-0000-0000-0000-000000000003':
      return 'Фозил';
    case '00000000-0000-0000-0000-000000000004':
      return 'Азиз';
    default:
      return 'Неизвестный';
  }
}