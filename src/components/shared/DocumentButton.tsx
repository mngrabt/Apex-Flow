import { Download } from 'lucide-react';
import { commonStyles } from './styles';

interface DocumentButtonProps {
  label: string;
  url: string;
  className?: string;
}

export default function DocumentButton({ label, url, className = '' }: DocumentButtonProps) {
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      className={`${commonStyles.document.button} ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Download className={commonStyles.document.icon} />
        <div>
          <h4 className={commonStyles.document.title}>{label}</h4>
          <p className={commonStyles.document.action}>Скачать</p>
        </div>
      </div>
    </button>
  );
}