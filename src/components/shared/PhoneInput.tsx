import { styles } from '../../utils/styleConstants';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  label, 
  error,
  className = '',
  ...props 
}: PhoneInputProps) {
  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    const parts = [
      digits.slice(0, 2),    // 99
      digits.slice(2, 5),    // 825
      digits.slice(5, 7),    // 37
      digits.slice(7, 9)     // 19
    ].filter(Boolean);
    
    return parts.join(' - ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const input = e.target.value.replace(/\D/g, '');
    
    // Limit to 9 digits
    const limitedInput = input.slice(0, 9);
    
    onChange(limitedInput);
  };

  const displayValue = formatPhoneNumber(value);

  return (
    <div>
      {label && (
        <label className={`block ${styles.text.label} mb-2`}>
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none">
          +998 
        </span>
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={`${styles.components.input} pl-[72px] ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}