import { useState } from 'react';
import { styles } from '../../utils/styleConstants';
import { Button, PhoneInput } from '../shared';
import { verifyTelegramChatId } from '../../services/telegram';

interface TelegramStepProps {
  formData: {
    telegramNumber: string;
    isTelegramSame: boolean;
    telegramChatId?: number;
    contactNumber: string;
  };
  onChange: (updates: Partial<typeof formData>) => void;
  onNext: () => void;
}

export default function TelegramStep({ formData, onChange, onNext }: TelegramStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const phoneNumber = formData.isTelegramSame ? formData.contactNumber : formData.telegramNumber;
      const chatId = await verifyTelegramChatId(`998${phoneNumber}`);

      if (chatId) {
        onChange({ telegramChatId: chatId });
        onNext();
      } else {
        setError('Не удалось подтвердить Telegram. Пожалуйста, убедитесь, что вы:\n1. Начали диалог с ботом @ApexFlowBot\n2. Отправили свой контакт через кнопку "Поделиться контактом"');
      }
    } catch (err) {
      console.error('Error verifying Telegram:', err);
      setError('Произошла ошибка при проверке Telegram');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className={`${styles.text.heading} mb-6`}>Подключение Telegram</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 whitespace-pre-line">
            {error}
          </div>
        )}

        <div>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={formData.isTelegramSame}
              onChange={(e) => onChange({ isTelegramSame: e.target.checked })}
              className={`h-4 w-4 ${styles.rounded.input} border-gray-300 text-primary focus:ring-primary`}
            />
            <span className={styles.text.body}>
              Использовать контактный номер для Telegram
            </span>
          </label>

          {!formData.isTelegramSame && (
            <PhoneInput
              label="Номер Telegram"
              value={formData.telegramNumber}
              onChange={(value) => onChange({ telegramNumber: value })}
              required
            />
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <h3 className={`${styles.text.subheading}`}>
            Подключите бота
          </h3>
          <p className={styles.text.body}>
            Для получения уведомлений и результата рассмотрения заявки:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Начните диалог с нашим ботом</li>
            <li>Нажмите кнопку "Поделиться контактом" в диалоге с ботом</li>
            <li>Вернитесь сюда и нажмите "Далее"</li>
          </ol>
          <a
            href="https://t.me/ApexFlowBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-[#0088cc] text-white rounded-xl font-medium hover:bg-[#0088cc]/90 transition-colors"
          >
            Открыть бота
          </a>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isVerifying}
          >
            {isVerifying ? 'Проверка...' : 'Далее'}
          </Button>
        </div>
      </form>
    </div>
  );
}