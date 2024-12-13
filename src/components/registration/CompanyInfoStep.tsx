import { styles } from '../../utils/styleConstants';
import { Button } from '../shared';
import CategorySelect from '../shared/CategorySelect';

interface CompanyInfoStepProps {
  formData: {
    companyName: string;
    contactPerson: string;
    contactNumber: string;
    email: string;
    categories: string[];
    isVatPayer: boolean;
    inn: string;
  };
  onChange: (updates: Partial<typeof formData>) => void;
  onNext: () => void;
}

export default function CompanyInfoStep({ formData, onChange, onNext }: CompanyInfoStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categories.length === 0) {
      alert('Выберите хотя бы одну категорию');
      return;
    }
    onNext();
  };

  const handleContactPersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
    onChange({ contactPerson: value });
  };

  const handleInnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    onChange({ inn: value });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className={`${styles.text.heading} mb-6`}>Информация о компании</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Название компании
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            required
            className={styles.components.input}
            placeholder="Введите название компании"
          />
        </div>

        <CategorySelect
          selectedCategories={formData.categories}
          onChange={(categories) => onChange({ categories })}
          required
        />

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Контактное лицо
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={handleContactPersonChange}
            required
            className={styles.components.input}
            placeholder="Введите имя контактного лица"
          />
        </div>

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Контактный номер
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none">
              +998 
            </span>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => onChange({ contactNumber: e.target.value.replace(/\D/g, '') })}
              required
              maxLength={9}
              className={`${styles.components.input} pl-[72px]`}
              placeholder="90 123 45 67"
            />
          </div>
        </div>

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Email адрес
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            required
            className={styles.components.input}
            placeholder="example@company.com"
          />
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isVatPayer}
              onChange={(e) => onChange({ isVatPayer: e.target.checked })}
              className={`h-4 w-4 ${styles.rounded.input} border-gray-300 text-primary focus:ring-primary`}
            />
            <span className={styles.text.body}>НДС плательщик</span>
          </label>
        </div>

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            ИНН
          </label>
          <input
            type="text"
            value={formData.inn}
            onChange={handleInnChange}
            required
            maxLength={9}
            className={styles.components.input}
            placeholder="Введите ИНН"
          />
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit">
            Далее
          </Button>
        </div>
      </form>
    </div>
  );
}