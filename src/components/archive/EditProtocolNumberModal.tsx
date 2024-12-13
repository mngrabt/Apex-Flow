import { useState } from 'react';
import { X, Hash } from 'lucide-react';
import { useArchiveStore } from '../../store/archive';

interface EditProtocolNumberModalProps {
  protocolId: string;
  currentNumber?: string;
  onClose: () => void;
}

export default function EditProtocolNumberModal({
  protocolId,
  currentNumber,
  onClose
}: EditProtocolNumberModalProps) {
  const { updateProtocolNumber } = useArchiveStore();
  const [number, setNumber] = useState(currentNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      await updateProtocolNumber(protocolId, number.trim());
      onClose();
    } catch (err) {
      console.error('Error updating protocol number:', err);
      setError('Произошла ошибка при обновлении номера протокола');
    } finally {
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
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Номер протокола
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Введите номер для этого протокола
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              {error && (
                <div className="flex items-start gap-2 p-3 mb-5 bg-red-50 rounded-xl">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg text-gray-900 
                           placeholder:text-gray-400 tracking-wide
                           focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                           transition-all duration-200 outline-none"
                  placeholder="123/45"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Номер
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20" />
                <p className="text-xs text-gray-500">
                  Используйте формат 123/45 для номера протокола
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl text-sm font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !number.trim()}
                className="relative h-11 px-6 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </span>
                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}