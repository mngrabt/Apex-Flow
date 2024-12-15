import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProtocolStore } from '../../store/protocol';
import { Protocol, TransferRequestItem, CashRequestItem } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Building2, Download, FileText, User2, ChevronLeft } from 'lucide-react';
import { styles } from '../../utils/styleConstants';
import { useAuthStore } from '../../store/auth';
import ProtocolSignatures from './ProtocolSignatures';

// Required signers list
const REQUIRED_SIGNERS = [
  '00000000-0000-0000-0000-000000000001', // Abdurauf
  '00000000-0000-0000-0000-000000000003', // Fozil
  '00000000-0000-0000-0000-000000000004', // Aziz
  '00000000-0000-0000-0000-000000000005'  // Umar
];

export default function ProtocolDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, view } = location.state || {};
  const { id } = useParams();
  const user = useAuthStore(state => state.user);
  const { protocols, fetchProtocols, signProtocol } = useProtocolStore();
  const [isSigningId, setIsSigningId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProtocols();
      } catch (error) {
        console.error('Error loading protocol data:', error);
      }
    };
    loadData();
  }, [fetchProtocols]);

  if (!user || !id) return null;

  const protocolData = protocols?.find(p => p.id === id);
  if (!protocolData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg font-medium text-gray-900">Протокол не найден</div>
        <button
          onClick={() => navigate('/protocols')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку
        </button>
      </div>
    );
  }

  const isCashProtocol = protocolData.type === 'cash';
  const requestItems = isCashProtocol 
    ? protocolData.request?.items as CashRequestItem[]
    : protocolData.tender?.request?.items as TransferRequestItem[];

  const winner = protocolData.tender?.suppliers?.find(s => s.id === protocolData.tender?.winnerId);
  const reserveWinner = protocolData.tender?.suppliers
    ?.filter(s => s.id !== protocolData.tender?.winnerId)
    .sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  const handleSign = async () => {
    if (!user || !protocolData) return;
    try {
      setIsSigningId(protocolData.id);
      await signProtocol(protocolData.id, user.id);

      // After signing, check if this was the final signature
      const updatedProtocol = protocols.find(p => p.id === id);
      if (updatedProtocol) {
        const signedUserIds = [...updatedProtocol.signatures.map(sig => sig.userId), user.id];
        const allSigned = REQUIRED_SIGNERS.every(id => signedUserIds.includes(id));

        // Only redirect if this was the final signature
        if (allSigned) {
          // Small delay to ensure the user sees their signature was added
          setTimeout(() => {
            navigate('/protocols');
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error signing protocol:', error);
    } finally {
      setIsSigningId(null);
    }
  };

  const handleBack = () => {
    if (from === 'finances') {
      navigate('/finances', { state: { view } });
    } else if (from === 'archive') {
      navigate('/archive', { state: { view } });
    } else {
      navigate('/protocols');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isCashProtocol 
                ? protocolData.request?.items[0]?.name 
                : protocolData.tender?.request?.items[0]?.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              от {format(new Date(protocolData.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mobile Layout - Sections in specified order */}
        <div className="space-y-6 lg:hidden">
          {/* Request Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Детали заявки</h2>
              <button
                onClick={() => window.open(
                  isCashProtocol 
                    ? protocolData.request?.documentUrl 
                    : protocolData.tender?.request?.documentUrl, 
                  '_blank'
                )}
                className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
              >
                Скачать ТЗ
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Name and Description */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Название</div>
                    <div className="font-medium text-gray-900">
                      {requestItems?.[0]?.name}
                    </div>
                  </div>
                  {requestItems?.[0]?.description && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Описание</div>
                      <div className="font-medium text-gray-900">
                        {requestItems?.[0]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(isCashProtocol 
                      ? protocolData.request?.createdAt || '' 
                      : protocolData.tender?.request?.createdAt || ''
                    ), 'd MMMM yyyy', { locale: ru })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Количество</div>
                  <div className="font-medium text-gray-900">
                    {requestItems?.[0]?.quantity} {!isCashProtocol && (requestItems?.[0] as TransferRequestItem)?.unitType}
                  </div>
                </div>

                {!isCashProtocol && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Место доставки</div>
                      <div className="font-medium text-gray-900">
                        {(requestItems?.[0] as TransferRequestItem)?.objectType === 'office' ? 'Офис' : 'Стройка'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Срок доставки</div>
                      <div className="font-medium text-gray-900">
                        {(requestItems?.[0] as TransferRequestItem)?.deadline} дней
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Winner Details */}
          {!isCashProtocol && winner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Победитель тендера</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Компания</div>
                    <div className="font-medium text-gray-900">{winner.companyName}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                    <div className="font-medium text-gray-900">{winner.contactPerson || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                    <div className="font-medium text-gray-900">{winner.deliveryTime} дней</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Сумма</div>
                    <div className="font-medium text-gray-900">{winner.price?.toLocaleString()} сум</div>
                  </div>
                </div>
                {winner.proposalUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <a
                        href={winner.proposalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Коммерческое предложение
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Winner Selection Reason */}
          {!isCashProtocol && protocolData.tender?.winnerReason && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Причина выбора</h2>
              <p className="text-sm text-gray-500">{protocolData.tender.winnerReason}</p>
            </div>
          )}

          {/* Reserve Winner */}
          {!isCashProtocol && reserveWinner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Резервный победитель</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Компания</div>
                    <div className="font-medium text-gray-900">{reserveWinner.companyName}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                    <div className="font-medium text-gray-900">{reserveWinner.contactPerson || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                    <div className="font-medium text-gray-900">{reserveWinner.deliveryTime} дней</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Сумма</div>
                    <div className="font-medium text-gray-900">{reserveWinner.price?.toLocaleString()} сум</div>
                  </div>
                </div>
                {reserveWinner.proposalUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <a
                        href={reserveWinner.proposalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Коммерческое предложение
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Подписи</h2>
            <ProtocolSignatures
              protocol={protocolData}
              onSign={handleSign}
              isSigningId={isSigningId}
            />
          </div>
        </div>

        {/* Desktop Layout - Original two-column layout */}
        <div className="hidden lg:block space-y-6">
          {/* Left Column Content */}
          {!isCashProtocol && winner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Победитель тендера</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Компания</div>
                    <div className="font-medium text-gray-900">{winner.companyName}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                    <div className="font-medium text-gray-900">{winner.contactPerson || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                    <div className="font-medium text-gray-900">{winner.deliveryTime} дней</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Сумма</div>
                    <div className="font-medium text-gray-900">{winner.price?.toLocaleString()} сум</div>
                  </div>
                </div>
                {winner.proposalUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <a
                        href={winner.proposalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Коммерческое предложение
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isCashProtocol && protocolData.tender?.winnerReason && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Причина выбора</h2>
              <p className="text-sm text-gray-500">{protocolData.tender.winnerReason}</p>
            </div>
          )}

          {!isCashProtocol && reserveWinner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Резервный победитель</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Компания</div>
                    <div className="font-medium text-gray-900">{reserveWinner.companyName}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                    <div className="font-medium text-gray-900">{reserveWinner.contactPerson || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                    <div className="font-medium text-gray-900">{reserveWinner.deliveryTime} дней</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Сумма</div>
                    <div className="font-medium text-gray-900">{reserveWinner.price?.toLocaleString()} сум</div>
                  </div>
                </div>
                {reserveWinner.proposalUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <a
                        href={reserveWinner.proposalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Коммерческое предложение
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block space-y-6">
          {/* Right Column Content */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Детали заявки</h2>
              <button
                onClick={() => window.open(
                  isCashProtocol 
                    ? protocolData.request?.documentUrl 
                    : protocolData.tender?.request?.documentUrl, 
                  '_blank'
                )}
                className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
              >
                Скачать ТЗ
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Name and Description */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Название</div>
                    <div className="font-medium text-gray-900">
                      {requestItems?.[0]?.name}
                    </div>
                  </div>
                  {requestItems?.[0]?.description && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Описание</div>
                      <div className="font-medium text-gray-900">
                        {requestItems?.[0]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(isCashProtocol 
                      ? protocolData.request?.createdAt || '' 
                      : protocolData.tender?.request?.createdAt || ''
                    ), 'd MMMM yyyy', { locale: ru })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Количество</div>
                  <div className="font-medium text-gray-900">
                    {requestItems?.[0]?.quantity} {!isCashProtocol && (requestItems?.[0] as TransferRequestItem)?.unitType}
                  </div>
                </div>

                {!isCashProtocol && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Место доставки</div>
                      <div className="font-medium text-gray-900">
                        {(requestItems?.[0] as TransferRequestItem)?.objectType === 'office' ? 'Офис' : 'Стройка'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Срок доставки</div>
                      <div className="font-medium text-gray-900">
                        {(requestItems?.[0] as TransferRequestItem)?.deadline} дней
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Подписи</h2>
            <ProtocolSignatures
              protocol={protocolData}
              onSign={handleSign}
              isSigningId={isSigningId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
