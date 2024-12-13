import { commonStyles } from './styles';

interface ListItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ListItem({ 
  title, 
  description, 
  children, 
  onClick,
  className = '' 
}: ListItemProps) {
  return (
    <div 
      className={`${commonStyles.list.item} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={commonStyles.list.header}>
        <div>
          <h3 className={commonStyles.list.title}>{title}</h3>
          {description && (
            <p className={commonStyles.list.description}>{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}