import { styles } from '../../../utils/styleConstants';

interface RequestFormBasicInfoProps {
  name: string;
  description: string;
  onChange: (field: string, value: string) => void;
}

export default function RequestFormBasicInfo({
  name,
  description,
  onChange
}: RequestFormBasicInfoProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Наименование
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          required
          className={styles.components.input}
          placeholder="Введите наименование"
        />
      </div>

      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Описание
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          required
          rows={4}
          className={`${styles.components.input} resize-none`}
          placeholder="Опишите требуемые товары или услуги"
        />
      </div>
    </div>
  );
}