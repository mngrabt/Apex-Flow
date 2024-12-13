import { useState, useEffect } from 'react';
import { X, Zap, Clock } from 'lucide-react';

interface UrgencyModalProps {
  protocolId: string;
  onSubmit: (id: string, urgency: 'high' | 'low') => Promise<void>;
  onClose: () => void;
}

export default function UrgencyModal({ protocolId, onSubmit, onClose }: UrgencyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSelect = async (urgency: 'high' | 'low') => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(protocolId, urgency);
    } catch (error) {
      console.error('Error submitting urgency:', error);
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Срочность заявки
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Выберите приоритет рассмотрения
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelect('high')}
              className={`
                relative overflow-hidden rounded-xl transition-all duration-200
                bg-gradient-to-br from-red-50 to-white
                hover:from-red-100/80 hover:to-red-50/80
                border border-red-200 hover:border-red-300
                disabled:opacity-50 disabled:cursor-not-allowed
                group
              `}
            >
              <div className="p-4">
                <div className="p-2 rounded-lg bg-red-100 text-red-500 w-fit mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">
                    Срочно
                  </div>
                  <div className="text-xs text-red-500/70">
                    Приоритетное рассмотрение
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-red-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelect('low')}
              className={`
                relative overflow-hidden rounded-xl transition-all duration-200
                bg-gradient-to-br from-primary/5 to-white
                hover:from-primary/10 hover:to-primary/5
                border border-primary/20 hover:border-primary/30
                disabled:opacity-50 disabled:cursor-not-allowed
                group
              `}
            >
              <div className="p-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-primary">
                    Не срочно
                  </div>
                  <div className="text-xs text-primary/70">
                    Стандартное рассмотрение
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}