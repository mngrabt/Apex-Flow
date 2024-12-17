import { ChevronLeft } from 'lucide-react';
import { Protocol } from '../../types';
import { styles } from '../../utils/styleConstants';

interface FinanceDetailsProps {
  protocol: Protocol;
  onBack: () => void;
}

export default function FinanceDetails({ protocol, onBack }: FinanceDetailsProps) {
  // Get the tender and request from the protocol
  const tender = protocol.tender;
  const request = tender?.request;
  const item = request?.items[0];

  if (!tender || !request || !item) {
    return (
      <div className="text-center py-12">
        <p className={`${styles.text.body} text-gray-500`}>Протокол не найден</p>
      </div>
    );
  }

  // Get winner and reserve winner
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
        Назад к финансам
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
                value={item.quantity && item.unitType ? `${item.quantity} ${item.unitType}` : '-'} 
              />
              <InfoBlock 
                label="Срок поставки" 
                value={item.deadline ? `${item.deadline} дней` : '-'} 
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
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h3 className={`${styles.text.subheading} mb-2`}>Победитель тендера</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InfoBlock label="Компания" value={winner.companyName || '-'} />
              <InfoBlock label="Представитель" value={winner.contactPerson || '-'} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <InfoBlock label="Телефон" value={winner.contactNumber || '-'} />
              <InfoBlock label="Срок поставки" value={winner.deliveryTime ? `${winner.deliveryTime} дней` : '-'} />
              <InfoBlock label="Цена за единицу" value={winner.pricePerUnit ? `${winner.pricePerUnit.toLocaleString()} сум` : '-'} />
              <InfoBlock label="Общая сумма" value={winner.price ? `${winner.price.toLocaleString()} сум` : '-'} />
            </div>
            {winner.proposalUrl && (
              <button
                onClick={() => window.open(winner.proposalUrl, '_blank')}
                className="mt-4 w-full bg-white rounded-xl p-4 text-left hover:bg-gray-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Предложение участника</h4>
                <p className={styles.text.body}>Скачать</p>
              </button>
            )}
          </div>
        )}

        {/* Reserve Winner Details */}
        {reserveWinner && (
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h3 className={`${styles.text.subheading} mb-2`}>Резервный победитель</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InfoBlock label="Компания" value={reserveWinner.companyName || '-'} />
              <InfoBlock label="Представитель" value={reserveWinner.contactPerson || '-'} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <InfoBlock label="Телефон" value={reserveWinner.contactNumber || '-'} />
              <InfoBlock label="Срок поставки" value={reserveWinner.deliveryTime ? `${reserveWinner.deliveryTime} дней` : '-'} />
              <InfoBlock label="Цена за единицу" value={reserveWinner.pricePerUnit ? `${reserveWinner.pricePerUnit.toLocaleString()} сум` : '-'} />
              <InfoBlock label="Общая сумма" value={reserveWinner.price ? `${reserveWinner.price.toLocaleString()} сум` : '-'} />
            </div>
            {reserveWinner.proposalUrl && (
              <button
                onClick={() => window.open(reserveWinner.proposalUrl, '_blank')}
                className="mt-4 w-full bg-white rounded-xl p-4 text-left hover:bg-gray-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Предложение участника</h4>
                <p className={styles.text.body}>Скачать</p>
              </button>
            )}
          </div>
        )}

        {/* Winner Selection Reason */}
        {tender.winnerReason && (
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className={`${styles.text.subheading} mb-4`}>Причина выбора победителя</h3>
            <p className={`${styles.text.body}`}>{tender.winnerReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-500 mb-1">{label}</h4>
      <p className={styles.text.body}>{value}</p>
    </div>
  );
}