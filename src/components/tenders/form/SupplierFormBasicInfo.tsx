import { Input } from '../../../components/shared';
import { styles } from '../../../utils/styleConstants';

interface SupplierFormBasicInfoProps {
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  deliveryTime: string;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
  disabledFields?: string[];
}

export default function SupplierFormBasicInfo({
  companyName,
  contactPerson,
  contactNumber,
  deliveryTime,
  onChange,
  disabled = false,
  disabledFields = []
}: SupplierFormBasicInfoProps) {
  const isFieldDisabled = (field: string) => disabled || disabledFields.includes(field);

  const getInputClassName = (field: string) => {
    return isFieldDisabled(field) 
      ? 'bg-gray-100 text-black-100 border-gray-200 cursor-not-allowed opacity-85' 
      : '';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Название компании
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          required
          disabled={isFieldDisabled('companyName')}
          placeholder="Введите название компании"
          className={`
            w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
            text-gray-900 placeholder-gray-400
            focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-gray-100 disabled:text-gray-500
            transition-colors duration-200
            ${getInputClassName('companyName')}
          `}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Контактное лицо
        </label>
        <input
          type="text"
          value={contactPerson}
          onChange={(e) => onChange('contactPerson', e.target.value)}
          required
          disabled={isFieldDisabled('contactPerson')}
          placeholder="Введите имя контактного лица"
          className={`
            w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
            text-gray-900 placeholder-gray-400
            focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-gray-100 disabled:text-gray-500
            transition-colors duration-200
            ${getInputClassName('contactPerson')}
          `}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Контактный телефон
        </label>
        <input
          type="tel"
          value={contactNumber}
          onChange={(e) => onChange('contactNumber', e.target.value)}
          required
          disabled={isFieldDisabled('contactNumber')}
          placeholder="Введите контактный телефон"
          className={`
            w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
            text-gray-900 placeholder-gray-400
            focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-gray-100 disabled:text-gray-500
            transition-colors duration-200
            ${getInputClassName('contactNumber')}
          `}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Срок поставки (дней)
        </label>
        <input
          type="number"
          value={deliveryTime}
          onChange={(e) => onChange('deliveryTime', e.target.value)}
          required
          disabled={isFieldDisabled('deliveryTime')}
          placeholder="Введите срок поставки в днях"
          min="1"
          className={`
            w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
            text-gray-900 placeholder-gray-400
            focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-gray-100 disabled:text-gray-500
            transition-colors duration-200
            ${getInputClassName('deliveryTime')}
          `}
        />
      </div>
    </div>
  );
}