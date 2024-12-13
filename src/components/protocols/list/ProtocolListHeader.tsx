import { styles } from '../../../utils/styleConstants';

interface ColumnConfig {
  name: number;
  signatures: number;
}

interface ProtocolListHeaderProps {
  columnOffsets?: Partial<ColumnConfig>;
}

const defaultOffsets: ColumnConfig = {
  name: 20,
  signatures: 380
};

export default function ProtocolListHeader({ columnOffsets = {} }: ProtocolListHeaderProps) {
  const offsets = { ...defaultOffsets, ...columnOffsets };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-2">
      <div className="col-span-8" style={{ transform: `translateX(${offsets.name}px)` }}>
        <div className={styles.text.tableHeader}>Наименование</div>
      </div>
      <div className="col-span-4" style={{ transform: `translateX(${offsets.signatures}px)` }}>
        <div className={styles.text.tableHeader}>Подписи</div>
      </div>
    </div>
  );
}