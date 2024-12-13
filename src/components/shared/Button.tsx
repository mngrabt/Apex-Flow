import { styles } from '../../utils/styleConstants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles = `${styles.components.button} ${styles.rounded.button}`;
  const variantStyles = variant === 'primary' 
    ? styles.colors.buttonPrimary
    : styles.colors.buttonSecondary;

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles} ${className}`}
    />
  );
}