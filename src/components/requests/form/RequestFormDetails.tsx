import { styles } from '../../../utils/styleConstants';

const UNIT_TYPES = [
  { value: 'шт', label: 'штук (шт)' },
  { value: 'м²', label: 'квадратных метров (м²)' },
  { value: 'л', label: 'литров (л)' },
  { value: 'кг', label: 'килограмм (кг)' },
  { value: 'м', label: 'метров (м)' },
];

const CATEGORIES = [
  'Металлоконструкции',
  'Строительные материалы',
  'Электрика',
  'Сантехника',
  'Отделочные материалы',
  'Мебель',
  'Оборудование',
  'Инструменты'
];

interface RequestFormDetailsProps {
  objectType: string;
  unitType: string;
  quantity: number;
  deadline: number;
  category: string;
  onChange: (field: string, value: any) => void;
}

export default function RequestFormDetails({
  objectType,
  unitType,
  quantity,
  deadline,
  category,
  onChange
}: RequestFormDetailsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Тип объекта
        </label>
        <select
          value={objectType}
          onChange={(e) => onChange('objectType', e.target.value)}
          className={styles.components.input}
          required
        >
          <option value="office">Офис</option>
          <option value="construction">Стройка</option>
        </select>
      </div>

      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Категория
        </label>
        <select
          value={category}
          onChange={(e) => onChange('category', e.target.value)}
          className={styles.components.input}
          required
        >
          <option value="" disabled>Выберите категорию</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Срок поставки (дней)
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={deadline || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            onChange('deadline', parseInt(value) || 0);
          }}
          required
          className={styles.components.input}
          placeholder="Укажите срок поставки"
        />
      </div>

      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Единица измерения
        </label>
        <select
          value={unitType}
          onChange={(e) => onChange('unitType', e.target.value)}
          className={styles.components.input}
          required
        >
          {UNIT_TYPES.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block ${styles.text.label} mb-1.5`}>
          Количество
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantity || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            onChange('quantity', parseInt(value) || 0);
          }}
          required
          className={styles.components.input}
          placeholder="Укажите количество"
        />
      </div>
    </div>
  );
}