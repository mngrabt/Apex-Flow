import { ChangeEvent } from 'react';
import { DollarSign, Calculator } from 'lucide-react';

interface SupplierFormPricingProps {
  pricePerUnit: string;
  price: string;
  includeTax: boolean;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
  quantity: number;
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
  inputMode?: 'text' | 'numeric' | 'decimal';
  hint?: string;
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
  inputMode,
  hint
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
    {hint && (
      <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
    )}
  </div>
);

const Toggle = ({
  checked,
  onChange,
  label,
  disabled
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className={`
      w-11 h-6 bg-gray-200
      rounded-full
      after:content-[''] after:absolute after:top-0.5 after:left-0.5
      after:bg-white after:rounded-full after:h-5 after:w-5
      after:transition-all after:duration-200
      peer-checked:after:translate-x-5
      peer-checked:bg-primary
      peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
    `}></div>
    <span className={`ml-3 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
      {label}
    </span>
  </label>
);

export default function SupplierFormPricing({
  pricePerUnit,
  price,
  includeTax,
  onChange,
  disabled = false,
  quantity
}: SupplierFormPricingProps) {
  const handlePricePerUnitChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange('pricePerUnit', value);

    // Calculate total price
    if (value && !isNaN(parseFloat(value))) {
      const total = (parseFloat(value) * quantity).toFixed(2);
      onChange('price', total);
    } else {
      onChange('price', '');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputField
          id="pricePerUnit"
          label="Цена за единицу"
          value={pricePerUnit}
          onChange={handlePricePerUnitChange}
          placeholder="0.00"
          disabled={disabled}
          required
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          icon={<DollarSign className="w-5 h-5" />}
          hint={`Количество: ${quantity} шт.`}
        />

        <InputField
          id="price"
          label="Общая сумма"
          value={price}
          onChange={(e) => onChange('price', e.target.value)}
          placeholder="0.00"
          disabled={true}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          icon={<Calculator className="w-5 h-5" />}
        />
      </div>

      <Toggle
        checked={includeTax}
        onChange={(checked) => onChange('includeTax', checked)}
        label="Включить НДС в стоимость"
        disabled={disabled}
      />
    </div>
  );
} 