import { format } from 'date-fns';
import { CheckCircle2, Clock, Banknote, AlertTriangle, X, Hash } from 'lucide-react';
import { ArchivedProtocol } from '../../../types';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useArchiveStore } from '../../../store/archive';
import { useAuthStore } from '../../../store/auth';

interface InfoBlockProps {
  label: string;
  value: string;
  onClick?: (e: React.MouseEvent) => void;
}

const InfoBlock = ({ label, value, onClick }: InfoBlockProps) => {
  const Component = onClick ? 'button' : 'div';
  const user = useAuthStore(state => state.user);
  const isDinara = user?.id === '00000000-0000-0000-0000-000000000006';
  const isNoNumber = isDinara && label === 'Номер' && value === 'Не указан';
  return (
    <Component
      onClick={onClick}
      className={`
        bg-gray-50 rounded-2xl p-4 text-center
        ${onClick ? 'hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200' : ''}
        ${isNoNumber ? 'animate-pulse-orange' : ''}
      `}
    >
      <div className={`text-sm font-medium ${isNoNumber ? 'text-orange-500' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </Component>
  );
};

// Add keyframes for orange pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-orange {
    0%, 100% { background-color: rgb(249 115 22 / 0.1); }
    50% { background-color: rgb(249 115 22 / 0.2); }
  }
  .animate-pulse-orange {
    animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
document.head.appendChild(style);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Номер протокола
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Введите номер для этого протокола
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Hash className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full h-10 pl-9 pr-16 bg-gray-50 border border-gray-200 rounded-lg text-base text-gray-900 
                         placeholder:text-gray-400
                         focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                         transition-all duration-200 outline-none"
                placeholder="123/45"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                Номер
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <p className="text-xs text-gray-500">
                Используйте формат 123/45 для номера протокола
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !number.trim()}
              className="relative h-9 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 
                       focus:outline-none focus:ring-2 focus:ring-primary/20 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200 overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </span>
              <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ArchiveListItemProps {
  protocol: ArchivedProtocol;
  requestName: string;
  onClick: () => void;
}

export default function ArchiveListItem({
  protocol,
  requestName,
  onClick
}: ArchiveListItemProps) {
  const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState(protocol.number);
  const { downloadArchive } = useArchiveStore();
  const user = useAuthStore(state => state.user);

  // Check if user can edit protocol numbers (only Abdurauf and Dinara)
  const canEditProtocolNumber = user?.id === '00000000-0000-0000-0000-000000000001' || // Abdurauf
                               user?.id === '00000000-0000-0000-0000-000000000006';    // Dinara

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadArchive(protocol, `protocol_${protocol.id}.zip`);
    } catch (error) {
      console.error('Error downloading archive:', error);
    }
  };

  const handleNumberClick = (e: React.MouseEvent) => {
    // Only allow editing if user has permission and protocol is not submitted
    if (!canEditProtocolNumber || protocol.financeStatus !== 'not_submitted') return;
    e.stopPropagation();
    setIsNumberModalOpen(true);
  };

  const handleNumberSubmit = async (number: string) => {
    // Double check permission before submitting
    if (!canEditProtocolNumber) return;

    const { error } = await supabase
      .from('archived_protocols')
      .update({ number })
      .eq('protocol_id', protocol.id);

    if (error) {
      throw error;
    }

    setLocalNumber(number);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'dd.MM.yy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return '—';
    }
  };

  const getFinanceStatusInfo = () => {
    switch (protocol.financeStatus) {
      case 'paid':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          text: 'Оплачен',
          className: 'bg-primary/10 text-primary'
        };
      case 'waiting':
        return {
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          text: 'Ожидает оплаты',
          className: 'bg-primary/10 text-primary'
        };
      case 'submitted':
        return {
          icon: <Banknote className="w-3.5 h-3.5 mr-1" />,
          text: 'Отправлен в оплату',
          className: 'bg-primary/10 text-primary'
        };
      default:
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          text: 'Не отправлен',
          className: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const statusInfo = getFinanceStatusInfo();

  const getCreationDate = () => {
    if (protocol.type === 'cash' && protocol.request) {
      return formatDate(protocol.request.createdAt);
    } else if (protocol.tender?.request) {
      return formatDate(protocol.tender.request.createdAt);
    }
    return '—';
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer"
      >
        {/* Content */}
        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                  {statusInfo.icon}
                  {statusInfo.text}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                  {requestName}
                </h3>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4">
            <InfoBlock
              label="Номер"
              value={localNumber || 'Не указан'}
              onClick={canEditProtocolNumber && protocol.financeStatus === 'not_submitted' ? handleNumberClick : undefined}
            />
            <InfoBlock
              label="Документы"
              value="Скачать"
              onClick={handleDownload}
            />
            <InfoBlock
              label="Создан"
              value={getCreationDate()}
            />
          </div>
        </div>
      </div>

      {/* Protocol Number Modal */}
      <ProtocolNumberModal
        isOpen={isNumberModalOpen}
        onClose={() => setIsNumberModalOpen(false)}
        onSubmit={handleNumberSubmit}
        currentNumber={localNumber}
      />
    </>
  );
}