import { ChevronLeft } from 'lucide-react';
import { commonStyles } from './styles';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export default function BackButton({ onClick, label = 'Назад' }: BackButtonProps) {
  return (
    <button onClick={onClick} className={commonStyles.backButton}>
      <ChevronLeft className="h-5 w-5 mr-1" />
      {label}
    </button>
  );
}