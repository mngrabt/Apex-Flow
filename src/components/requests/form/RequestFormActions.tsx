import { styles } from '../../../utils/styleConstants';

interface RequestFormActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
}

export default function RequestFormActions({ isSubmitting, onClose }: RequestFormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-8">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors font-medium disabled:opacity-50"
      >
        Отмена
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-3 bg-[#ff6b00] text-white rounded-lg hover:bg-[#ff6b00]/90 transition-colors font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Создание...' : 'Создать заявку'}
      </button>
    </div>
  );
}