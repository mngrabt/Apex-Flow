import { ChangeEvent } from 'react';
import { Building2, User, Phone, Clock } from 'lucide-react';

interface SupplierFormBasicInfoProps {
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  deliveryTime: string;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
  readOnlyFields?: string[];
}

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  icon: React.ReactNode;
  pattern?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
}

const InputField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  type = 'text',
  icon,
  pattern,
  inputMode
}: InputFieldProps) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {required && <span className="text-xs text-gray-400">Обязательно</span>}
    </div>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className={`
          w-full h-11 pl-10 pr-4 
          bg-gray-50 border border-gray-200 
          rounded-lg text-gray-900
          placeholder:text-gray-400
          transition-colors
          hover:border-gray-300
          focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        `}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        pattern={pattern}
        inputMode={inputMode}
      />
    </div>
  </div>
);

const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Remove all non-digits
  const digits = e.target.value.replace(/\D/g, '');
  
  // Format the number with spaces
  let formatted = '';
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
  
  onChange('contactNumber', formatted);
};

export default function SupplierFormBasicInfo({
  companyName,
  contactPerson,
  contactNumber,
  deliveryTime,
  onChange,
  disabled = false,
  readOnlyFields = []
}: SupplierFormBasicInfoProps) {
  const isFieldReadOnly = (field: string) => readOnlyFields.includes(field);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <InputField
        id="companyName"
        label="Название компании"
        value={companyName}
        onChange={(e) => onChange('companyName', e.target.value)}
        placeholder="Введите название компании"
        disabled={disabled || isFieldReadOnly('companyName')}
        required
        icon={<Building2 className="w-5 h-5" />}
      />

      <InputField
        id="contactPerson"
        label="Представитель"
        value={contactPerson}
        onChange={(e) => onChange('contactPerson', e.target.value)}
        placeholder="Введите ФИО контактного лица"
        disabled={disabled || isFieldReadOnly('contactPerson')}
        required
        icon={<User className="w-5 h-5" />}
      />

      <InputField
        id="contactNumber"
        label="Контактный телефон"
        value={contactNumber}
        onChange={handlePhoneNumberChange}
        placeholder="99 123 45 67"
        disabled={disabled || isFieldReadOnly('contactNumber')}
        required
        type="tel"
        inputMode="tel"
        pattern="[0-9 ]+"
        icon={<Phone className="w-5 h-5" />}
      />

      <InputField
        id="deliveryTime"
        label="Срок поставки (в днях)"
        value={deliveryTime}
        onChange={(e) => onChange('deliveryTime', e.target.value)}
        placeholder="Введите срок поставки..."
        disabled={disabled}
        required
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        icon={<Clock className="w-5 h-5" />}
      />
    </div>
  );
} 