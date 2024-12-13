import { commonStyles } from './styles';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className={commonStyles.header}>
      <h1 className={commonStyles.heading}>{title}</h1>
      {children}
    </div>
  );
}