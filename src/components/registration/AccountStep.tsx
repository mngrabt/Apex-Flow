import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { styles } from '../../utils/styleConstants';
import { Button } from '../shared';
import { useSupplierApplicationStore } from '../../store/supplierApplication';

interface AccountStepProps {
  formData: {
    companyName: string;
    contactPerson: string;
    contactNumber: string;
    email: string;
    categories: string[];
    isVatPayer: boolean;
    inn: string;
    vatCertificate?: File;
    license?: File;
    passport?: File;
    form?: File;
    telegramNumber: string;
    isTelegramSame: boolean;
    telegramChatId?: number;
    username: string;
    password: string;
    confirmPassword: string;
  };
  onChange: (updates: Partial<typeof formData>) => void;
}

export default function AccountStep({ formData, onChange }: AccountStepProps) {
  const navigate = useNavigate();
  const { submitApplication } = useSupplierApplicationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await submitApplication({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        email: formData.email,
        categories: formData.categories,
        isVatPayer: formData.isVatPayer,
        inn: formData.inn,
        vatCertificate: formData.vatCertificate,
        license: formData.license,
        passport: formData.passport,
        form: formData.form,
        telegramNumber: formData.isTelegramSame ? formData.contactNumber : formData.telegramNumber,
        isTelegramSame: formData.isTelegramSame,
        telegramChatId: formData.telegramChatId,
        username: formData.username.toLowerCase(),
        password: formData.password
      });

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Произошла ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className={`${styles.text.heading} text-center`}>Заявка отправлена!</h2>
          <p className="text-gray-500">
            Ваша заявка успешно отправлена на рассмотрение. Мы уведомим вас о результате через Telegram.
            <br />
            Перенаправление на страницу входа...
          </p>
        </div>
      </div>
    );
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    onChange({ username: value });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className={`${styles.text.heading} mb-6`}>Создание аккаунта</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Имя пользователя
          </label>
          <div className="space-y-1">
            <input
              type="text"
              value={formData.username}
              onChange={handleUsernameChange}
              className={styles.components.input}
              placeholder="Введите имя пользователя"
              aria-label="Имя пользователя"
              required
            />
            <p className="text-xs text-gray-500">
              Только строчные латинские буквы и цифры
            </p>
          </div>
        </div>

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => onChange({ password: e.target.value })}
              required
              minLength={8}
              className={styles.components.input}
              placeholder="Введите пароль"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Подтвердите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onChange({ confirmPassword: e.target.value })}
              required
              minLength={8}
              className={styles.components.input}
              placeholder="Повторите пароль"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </Button>
        </div>
      </form>
    </div>
  );
}