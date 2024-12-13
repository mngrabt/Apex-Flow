import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTaskStore } from '../../store/task';
import { User } from '../../types';
import { styles } from '../../utils/styleConstants';

interface TaskFormProps {
  onClose: () => void;
}

export default function TaskForm({ onClose }: TaskFormProps) {
  const user = useAuthStore((state) => state.user) as User;
  const { addTask } = useTaskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    document: undefined as File | undefined,
    documentUrl: undefined as string | undefined
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const taskData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        documentUrl: formData.documentUrl,
        document: formData.document,
        createdBy: user.id
      };

      await addTask(taskData);
      onClose();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении задачи');
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
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Новая задача
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Заполните информацию о задаче
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-5">
              {/* Left Side */}
              <div className="col-span-2 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Наименование
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.input}
                    placeholder="Введите название задачи"
                    aria-label="Название задачи"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className={`${styles.input} resize-none`}
                    placeholder="Введите описание задачи"
                  />
                </div>
              </div>

              {/* Right Side */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Документация
                </label>
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({ ...prev, document: file }));
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
                />
                {formData.document ? (
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900">
                    <div className="flex items-center min-w-0">
                      <Upload className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                      <span className="text-sm truncate">
                        {formData.document.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, document: undefined }))}
                      className="flex items-center justify-center w-full h-8 gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors text-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Удалить файл</span>
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="document-upload"
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 bg-white hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    <Upload className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm text-center text-gray-600 group-hover:text-gray-900">
                      Нажмите чтобы загрузить файл
                    </span>
                  </label>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG или HEIC до 10MB
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-6 rounded-xl text-sm font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}