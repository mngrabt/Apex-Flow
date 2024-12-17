import { useState } from 'react';
import { useSupplierStore } from '../../store/supplier';
import { Modal, Button, Input, PhoneInput } from '../shared';
import CategorySelect from '../shared/CategorySelect';
import { Upload } from 'lucide-react';
import { styles } from '../../utils/styleConstants';

interface AddSupplierModalProps {
  onClose: () => void;
}

export default function AddSupplierModal({ onClose }: AddSupplierModalProps) {
  const { addSupplier } = useSupplierStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categories: [] as string[],
    contactPerson: '',
    phone: '',
    email: '',
    inn: '',
    isVatPayer: false,
    vatCertificate: undefined as File | undefined,
    license: undefined as File | undefined,
    passport: undefined as File | undefined,
    form: undefined as File | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      if (formData.categories.length === 0) {
        throw new Error('Выберите хотя бы одну категорию');
      }

      // Upload files if present
      const uploadFile = async (file: File | undefined, prefix: string) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `supplier_applications/${prefix}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        return publicUrl;
      };

      const [vatCertificateUrl, licenseUrl, passportUrl, formUrl] = await Promise.all([
        uploadFile(formData.vatCertificate, 'vat'),
        uploadFile(formData.license, 'license'),
        uploadFile(formData.passport, 'passport'),
        uploadFile(formData.form, 'form')
      ]);

      await addSupplier({
        name: formData.name.trim(),
        categories: formData.categories,
        status: 'verified',
        notificationsEnabled: false,
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        inn: formData.inn.trim(),
        vatCertificateUrl,
        licenseUrl,
        passportUrl,
        formUrl
      });
      onClose();
    } catch (error) {
      console.error('Error adding supplier:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при добавлении поставщика');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Добавить поставщика" onClose={onClose}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Наименование"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Введите название компании"
        />

        <CategorySelect
          selectedCategories={formData.categories}
          onChange={(categories) => setFormData({ ...formData, categories })}
          required
        />

        <Input
          label="Представитель"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          required
          placeholder="Введите имя контактного лица"
        />

        <PhoneInput
          label="Телефон"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="Введите email"
        />

        <Input
          label="ИНН"
          value={formData.inn}
          onChange={(e) => setFormData({ ...formData, inn: e.target.value.replace(/\D/g, '') })}
          required
          maxLength={9}
          placeholder="Введите ИНН"
        />

        <div>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={formData.isVatPayer}
              onChange={(e) => setFormData({ ...formData, isVatPayer: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className={styles.text.body}>НДС плательщик</span>
          </label>
        </div>

        {/* Document Uploads */}
        <div className="space-y-4">
          {formData.isVatPayer && (
            <DocumentUpload
              label="Сертификат НДС"
              onChange={(file) => setFormData({ ...formData, vatCertificate: file })}
              file={formData.vatCertificate}
            />
          )}

          <DocumentUpload
            label="Гувохнома"
            onChange={(file) => setFormData({ ...formData, license: file })}
            file={formData.license}
          />

          <DocumentUpload
            label="Паспорт директора"
            onChange={(file) => setFormData({ ...formData, passport: file })}
            file={formData.passport}
          />

          <DocumentUpload
            label="Анкета"
            onChange={(file) => setFormData({ ...formData, form: file })}
            file={formData.form}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить поставщика'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DocumentUpload({ 
  label, 
  onChange, 
  file 
}: { 
  label: string; 
  onChange: (file: File | undefined) => void;
  file?: File;
}) {
  return (
    <div>
      <label className={`block ${styles.text.label} mb-2`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          id={`file-${label}`}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
          accept=".pdf,.doc,.docx,.jpg,.png,.heic"
        />
        <label
          htmlFor={`file-${label}`}
          className={`${styles.components.input} cursor-pointer flex items-center`}
        >
          <Upload className="h-5 w-5 mr-2 text-gray-400" />
          <span className="text-gray-500">
            {file ? file.name : 'Загрузить документ'}
          </span>
        </label>
      </div>
    </div>
  );
}