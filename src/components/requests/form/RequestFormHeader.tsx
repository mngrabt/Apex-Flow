import { X } from 'lucide-react';
import { styles } from '../../../utils/styleConstants';

interface RequestFormHeaderProps {
  onClose: () => void;
}

export default function RequestFormHeader({ onClose }: RequestFormHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className={styles.text.heading}>Новая заявка</h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}