import { styles } from '../../utils/styleConstants';

interface ColumnConfig {
  company: number;
  category: number;
  contact: number;
  notifications: number;
}

interface DatabaseHeaderProps {
  view?: string;
  onViewChange?: (view: string) => void;
  columnOffsets?: Partial<ColumnConfig>;
}

const defaultOffsets: ColumnConfig = {
  company: 20,
  category: -150,
  contact: 30,
  notifications: -80
};

export default function DatabaseHeader({ view, onViewChange, columnOffsets = {} }: DatabaseHeaderProps) {
  const offsets = { ...defaultOffsets, ...columnOffsets };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4">
      <div className="col-span-4 flex items-center" style={{ transform: `translateX(${offsets.company}px)` }}>
        <div className={styles.text.tableHeader}>Компания</div>
      </div>
      <div className="col-span-3 flex items-center justify-center" style={{ transform: `translateX(${offsets.category}px)` }}>
        <div className={styles.text.tableHeader}>Категория</div>
      </div>
      <div className="col-span-3 flex items-center" style={{ transform: `translateX(${offsets.contact}px)` }}>
        <div className={styles.text.tableHeader}>Контактное лицо</div>
      </div>
      <div className="col-span-2 flex items-center justify-end" style={{ transform: `translateX(${offsets.notifications}px)` }}>
        <div className={styles.text.tableHeader}>Уведомления</div>
      </div>
    </div>
  );
}