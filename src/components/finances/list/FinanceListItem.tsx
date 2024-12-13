import { Protocol } from '../../../types';
import { format, differenceInDays } from 'date-fns';
import { Banknote, ArrowRightLeft, Hash, Download } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useFinanceStore } from '../../../store/finance';

interface InfoBlockProps {
  label: string;
  value: string;
  onClick?: (e: React.MouseEvent) => void;
}

const InfoBlock = ({ label, value, onClick }: InfoBlockProps) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`
        bg-gray-50 rounded-2xl p-4 text-center
        ${onClick ? 'hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200' : ''}
      `}
    >
      <div className="text-sm font-medium text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </Component>
  );
};

interface ProtocolNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (number: string) => Promise<void>;
  currentNumber?: string;
}

function ProtocolNumberModal({ isOpen, onClose, onSubmit, currentNumber }: ProtocolNumberModalProps) {
  const [number, setNumber] = useState(currentNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(number);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/25 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Номер протокола
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Введите номер
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
                         text-gray-900 placeholder-gray-400
                         focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
                         transition-colors duration-200"
                placeholder="Например: 123/45"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-4 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg
                       hover:bg-gray-100 active:bg-gray-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !number.trim()}
              className="h-11 px-4 bg-primary text-white text-sm font-medium rounded-lg
                       hover:bg-primary/90 active:bg-primary/80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FinanceListItemProps {
  protocol: Protocol;
  protocolName: string;
  view: 'not_submitted' | 'waiting' | 'paid';
  onClick: () => void;
  onSubmit?: (id: string) => void;
  onPaid?: (id: string) => void;
}

export default function FinanceListItem({
  protocol,
  protocolName,
  view,
  onClick,
  onSubmit,
  onPaid
}: FinanceListItemProps) {
  const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState(protocol.number);
  const { downloadArchive } = useFinanceStore();

  const getWaitingDays = () => {
    if (!protocol.submittedAt) return 0;
    return differenceInDays(new Date(), new Date(protocol.submittedAt));
  };

  const getTotalWaitingDays = () => {
    if (!protocol.submittedAt || !protocol.paidAt) return 0;
    return differenceInDays(new Date(protocol.paidAt), new Date(protocol.submittedAt));
  };

  const handleNumberClick = (e: React.MouseEvent) => {
    return;
  };

  const handleNumberSubmit = async (number: string) => {
    const { error } = await supabase
      .from('archived_protocols')
      .update({ number })
      .eq('protocol_id', protocol.id);

    if (error) {
      throw error;
    }

    setLocalNumber(number);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadArchive(protocol, `protocol_${protocol.id}.zip`);
    } catch (error) {
      console.error('Error downloading archive:', error);
    }
  };

  const waitingDays = getWaitingDays();
  const totalDays = getTotalWaitingDays();
  const isUrgent = protocol.urgency === 'high';

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer"
      >
        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {protocol.type === 'cash' ? (
                      <>
                        <Banknote className="w-3.5 h-3.5 mr-1" />
                        Наличные
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                        Перечисление
                      </>
                    )}
                  </div>
                  {(view === 'waiting' || view === 'paid') && localNumber && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <Hash className="w-3.5 h-3.5 mr-1" />
                      {localNumber}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                  {protocolName}
                </h3>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4">
            {view === 'not_submitted' && (
              <>
                <InfoBlock
                  label="Создан"
                  value={format(new Date(protocol.createdAt), 'dd.MM.yy')}
                />
                <InfoBlock
                  label="Документы"
                  value="Скачать"
                  onClick={handleDownload}
                />
                <InfoBlock
                  label="Номер"
                  value={localNumber || 'Не указан'}
                />
              </>
            )}
            
            {view === 'waiting' && (
              <>
                <InfoBlock
                  label="Дней в ожидании"
                  value={waitingDays.toString()}
                />
                <InfoBlock
                  label="Документы"
                  value="Скачать"
                  onClick={handleDownload}
                />
                <InfoBlock
                  label="Срочность"
                  value={protocol.urgency === 'high' ? 'Высокая' : 'Низкая'}
                />
              </>
            )}
            
            {view === 'paid' && (
              <>
                <InfoBlock
                  label="Дата подачи"
                  value={protocol.submittedAt ? format(new Date(protocol.submittedAt), 'dd.MM.yy') : '-'}
                />
                <InfoBlock
                  label="Документы"
                  value="Скачать"
                  onClick={handleDownload}
                />
                <InfoBlock
                  label="Дата оплаты"
                  value={protocol.paidAt ? format(new Date(protocol.paidAt), 'dd.MM.yy') : '-'}
                />
              </>
            )}
          </div>

          {/* Action Button */}
          {(view === 'not_submitted' && onSubmit) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSubmit) onSubmit(protocol.id);
              }}
              disabled={!localNumber}
              className="h-11 w-full bg-primary text-white text-sm font-medium rounded-lg
                       hover:bg-primary/90 active:bg-primary/80
                       disabled:bg-gray-100 disabled:text-gray-500
                       transition-all duration-200"
            >
              {!localNumber ? 'Номер протокола не указан' : 'Отправить на оплату'}
            </button>
          )}
          {(view === 'waiting' && onPaid) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPaid(protocol.id);
              }}
              className="w-full bg-primary text-white rounded-2xl p-4 text-center
                       hover:bg-primary/90 transition-all cursor-pointer
                       text-sm font-medium"
            >
              Оплачено
            </button>
          )}
        </div>
      </div>

      <ProtocolNumberModal
        isOpen={isNumberModalOpen}
        onClose={() => setIsNumberModalOpen(false)}
        onSubmit={handleNumberSubmit}
        currentNumber={localNumber}
      />
    </>
  );
} 