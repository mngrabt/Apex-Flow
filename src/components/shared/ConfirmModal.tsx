import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'Утвердить выбор',
  cancelText = 'Отмена',
  onConfirm,
  onClose,
  onCancel,
  isLoading = false,
  isDestructive = false,
  icon
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="-mt-1 p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="flex gap-4">
              {(icon || isDestructive) && (
                <div className="p-3 rounded-xl flex-shrink-0 bg-primary/10 text-primary">
                  {icon || <AlertTriangle className="h-5 w-5" />}
                </div>
              )}
              <div className="text-[15px] text-gray-600 leading-relaxed">
                {message}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel || onClose}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl text-sm font-medium text-gray-700
                         bg-white border border-gray-200 hover:bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-primary/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-12 px-6 rounded-xl text-sm font-medium text-white
                         ${isDestructive 
                           ? 'bg-primary hover:bg-primary/90'
                           : 'bg-primary hover:bg-primary/90'
                         }
                         focus:outline-none focus:ring-2 focus:ring-primary/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors`}
              >
                {isLoading ? 'Загрузка...' : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}