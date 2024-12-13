import { useState } from 'react';
import { styles } from '../../../utils/styleConstants';

interface CashRequestFormData {
  name: string;
  description: string;
  quantity: number;
  totalSum: number;
}

interface CashRequestFormProps {
  data: CashRequestFormData;
  onChange: (data: CashRequestFormData) => void;
}

export default function CashRequestForm({ data, onChange }: CashRequestFormProps) {
  const handleChange = (field: keyof CashRequestFormData, value: string | number) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const formatNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = parseInt(numericValue) || 0;
    return number;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className={styles.text.label}>
          Наименование
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          className={styles.components.input}
          placeholder="Введите наименование"
          aria-label="Наименование"
        />
      </div>

      <div>
        <label className={styles.text.label}>
          Описание
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
          rows={4}
          className={`${styles.components.input} resize-none`}
          placeholder="Опишите требуемые товары или услуги"
          aria-label="Описание"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={styles.text.label}>
            Количество
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.quantity || ''}
            onChange={(e) => handleChange('quantity', formatNumber(e.target.value))}
            required
            className={styles.components.input}
            placeholder="Укажите количество"
            aria-label="Количество"
          />
        </div>

        <div>
          <label className={styles.text.label}>
            Общая сумма (сум)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data.totalSum || ''}
            onChange={(e) => handleChange('totalSum', formatNumber(e.target.value))}
            required
            className={styles.components.input}
            placeholder="Введите общую сумму"
            aria-label="Общая сумма"
          />
          {data.totalSum <= 0 && (
            <p className="mt-1 text-sm text-red-500">
              Сумма должна быть больше нуля
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 