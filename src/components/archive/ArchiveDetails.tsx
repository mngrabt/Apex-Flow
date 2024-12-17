import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useArchiveStore } from '../../store/archive';
import { styles } from '../../utils/styleConstants';
import { formatMoney } from '../../utils/formatters';

interface ArchiveDetailsProps {
  protocolId: string;
  onBack: () => void;
}

interface InfoBlockProps {
  label: string;
  value: string | number;
}

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-500 mb-1">{label}</h4>
      <p className={styles.text.body}>{value}</p>
    </div>
  );
}

export default function ArchiveDetails({ protocolId, onBack }: ArchiveDetailsProps) {
  const { archivedProtocols, fetchArchivedProtocols } = useArchiveStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchArchivedProtocols();
      } catch (error) {
        console.error('Error loading archive details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchArchivedProtocols]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка протокола из архива...</p>
        </div>
      </div>
    );
  }

  const protocol = archivedProtocols.find(p => p.id === protocolId);

  if (!protocol?.tender?.request?.items[0]) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 text-gray-300">
            <AlertTriangle className="w-full h-full" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Протокол не найден</p>
        </div>
      </div>
    );
  }

  const tender = protocol.tender;
  if (!tender || !tender.request) return null;
  
  const request = tender.request;
  const item = request.items[0];
  const winner = tender.suppliers.find(s => s.id === tender.winnerId);
  const reserveWinner = tender.suppliers
    .filter(s => s.id !== tender.winnerId)
    .sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Назад к архиву
      </button>

      <div className="space-y-6">
        {/* Request Details */}
        <div className={styles.components.card}>
          <h2 className={`${styles.text.heading} mb-6`}>Детали заявки</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className={styles.text.subheading}>{item.name}</h3>
              <p className={`${styles.text.body} text-gray-500 mt-2`}>{item.description}</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <InfoBlock 
                label="Количество" 
                value={`${item.quantity} ${item.unitType}`} 
              />
              <InfoBlock 
                label="Срок поставки" 
                value={`${item.deadline} дней`} 
              />
              <InfoBlock 
                label="Тип объекта" 
                value={item.objectType === 'office' ? 'Офис' : 'Стройка'} 
              />
              {request.documentUrl && (
                <button
                  onClick={() => window.open(request.documentUrl, '_blank')}
                  className="bg-gray-50 rounded-2xl p-4 text-left hover:bg-gray-100 transition-colors group"
                >
                  <h4 className="text-sm font-semibold text-gray-500 group-hover:text-primary mb-1">
                    Техническое задание
                  </h4>
                  <p className={`${styles.text.body} group-hover:text-primary`}>
                    Скачать
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Winner Details */}
        {winner && (
          <div className={styles.components.card}>
            <h2 className={`${styles.text.heading} mb-6`}>Победитель тендера</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Компания" value={winner.companyName} />
                <InfoBlock label="Представитель" value={winner.contactPerson || '-'} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <InfoBlock label="Телефон" value={winner.contactNumber || '-'} />
                <InfoBlock label="Срок поставки" value={`${winner.deliveryTime} дней`} />
                <InfoBlock label="Цена за единицу" value={formatMoney(winner.pricePerUnit)} />
                <InfoBlock label="Общая сумма" value={formatMoney(winner.price)} />
              </div>
              {winner.proposalUrl && (
                <button
                  onClick={() => window.open(winner.proposalUrl, '_blank')}
                  className="w-full bg-gray-50 rounded-2xl p-4 text-left hover:bg-gray-100 transition-colors group"
                >
                  <h4 className="text-sm font-semibold text-gray-500 group-hover:text-primary mb-1">
                    Предложение участника
                  </h4>
                  <p className={`${styles.text.body} group-hover:text-primary`}>
                    Скачать
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reserve Winner Details */}
        {reserveWinner && (
          <div className={styles.components.card}>
            <h2 className={`${styles.text.heading} mb-6`}>Резервный победитель</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Компания" value={reserveWinner.companyName} />
                <InfoBlock label="Представитель" value={reserveWinner.contactPerson || '-'} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <InfoBlock label="Телефон" value={reserveWinner.contactNumber || '-'} />
                <InfoBlock label="Срок поставки" value={`${reserveWinner.deliveryTime} дней`} />
                <InfoBlock label="Цена за единицу" value={formatMoney(reserveWinner.pricePerUnit)} />
                <InfoBlock label="Общая сумма" value={formatMoney(reserveWinner.price)} />
              </div>
              {reserveWinner.proposalUrl && (
                <button
                  onClick={() => window.open(reserveWinner.proposalUrl, '_blank')}
                  className="w-full bg-gray-50 rounded-2xl p-4 text-left hover:bg-gray-100 transition-colors group"
                >
                  <h4 className="text-sm font-semibold text-gray-500 group-hover:text-primary mb-1">
                    Предложение участника
                  </h4>
                  <p className={`${styles.text.body} group-hover:text-primary`}>
                    Скачать
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Winner Selection Reason */}
        {tender.winnerReason && (
          <div className={styles.components.card}>
            <h2 className={`${styles.text.heading} mb-6`}>Причина выбора победителя</h2>
            <p className={`${styles.text.body}`}>{tender.winnerReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
