import { useState } from 'react';
import { Modal, Button } from '../shared';
import { styles } from '../../utils/styleConstants';
import { useAuthStore } from '../../store/auth';
import { useSupplierApplicationStore } from '../../store/supplierApplication';

interface ReviewModalProps {
  applicationId: string;
  onClose: () => void;
}

export default function ReviewModal({ applicationId, onClose }: ReviewModalProps) {
  const user = useAuthStore(state => state.user);
  const { reviewApplication } = useSupplierApplicationStore();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (approved: boolean) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await reviewApplication(applicationId, approved, notes, user.id);
      onClose();
    } catch (err) {
      console.error('Error reviewing application:', err);
      setError('Произошла ошибка при рассмотрении заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Рассмотрение заявки" onClose={onClose}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Комментарий
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            rows={4}
            className={`${styles.components.input} resize-none`}
            placeholder="Введите комментарий..."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !notes}
          >
            Отклонить
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !notes}
          >
            Одобрить
          </Button>
        </div>
      </div>
    </Modal>
  );
}