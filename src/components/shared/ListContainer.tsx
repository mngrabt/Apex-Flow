import { commonStyles } from './styles';

interface ListContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ListContainer({ children, className = '' }: ListContainerProps) {
  return (
    <div className={`${commonStyles.list.container} ${className}`}>
      {children}
    </div>
  );
}