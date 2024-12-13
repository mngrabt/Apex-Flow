import { commonStyles } from './styles';

interface InfoBlockProps {
  label: string;
  value: string | number;
  className?: string;
  onClick?: () => void;
  isDocument?: boolean;
  documentUrl?: string;
}

export default function InfoBlock({ label, value, className = '', onClick, isDocument, documentUrl }: InfoBlockProps) {
  if (isDocument && documentUrl) {
    return (
      <a
        href={documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${commonStyles.infoBlock} hover:bg-gray-100 transition-colors text-center ${onClick ? 'hover:bg-gray-100 transition-colors' : ''} ${className}`}
        onClick={onClick}
      >
        <h4 className={`${commonStyles.infoBlockLabel} text-center`}>{label}</h4>
        <p className={`${commonStyles.infoBlockValue} text-center`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </a>
    );
  }
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component 
      className={`${commonStyles.infoBlock} ${onClick ? 'hover:bg-gray-100 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      <h4 className={`${commonStyles.infoBlockLabel} text-center`}>{label}</h4>
      <p className={`${commonStyles.infoBlockValue} text-center`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Component>
  );
}