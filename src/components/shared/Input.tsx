import { styles } from '../../utils/styleConstants';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className={`block ${styles.text.label} mb-2`}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`${styles.components.input} ${className}`}
      />
    </div>
  );
}