import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { styles } from '../../utils/styleConstants';
import { Button } from '../shared';

interface DocumentsStepProps {
  formData: {
    isVatPayer: boolean;
    vatCertificate?: File;
    license?: File;
    passport?: File;
    form?: File;
  };
  onChange: (updates: Partial<typeof formData>) => void;
  onNext: () => void;
}

export default function DocumentsStep({ formData, onChange, onNext }: DocumentsStepProps) {
  const [formUrl] = useState('https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/documents/supplier-form.pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const renderFileInput = (
    id: string,
    label: string,
    file: File | undefined,
    onChange: (file: File | undefined) => void,
    required = true
  ) => (
    <div>
      <label className={`block ${styles.text.label} mb-2`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          id={id}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
          required={required}
          accept=".pdf,.doc,.docx,.jpg,.png,.heic"
        />
        <label
          htmlFor={id}
          className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors cursor-pointer group"
        >
          <Upload className="h-5 w-5 mr-2 text-gray-400 group-hover:text-gray-600" />
          {file ? file.name : 'Загрузить документ'}
        </label>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className={`${styles.text.heading} mb-6`}>Документы</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formData.isVatPayer && (
          renderFileInput(
            'vat-certificate',
            'Сертификат НДС',
            formData.vatCertificate,
            (file) => onChange({ vatCertificate: file })
          )
        )}

        {renderFileInput(
          'license',
          'Гувохнома',
          formData.license,
          (file) => onChange({ license: file })
        )}

        {renderFileInput(
          'passport',
          'Паспорт директора',
          formData.passport,
          (file) => onChange({ passport: file })
        )}

        <div>
          <label className={`block ${styles.text.label} mb-2`}>
            Анкета
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.open(formUrl, '_blank')}
              className="flex items-center px-4 py-3 bg-[#FF6B00] text-white rounded-xl font-medium hover:bg-[#FF6B00]/90 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Скачать форму
            </button>
            <div className="flex-1">
              <input
                type="file"
                id="form"
                className="hidden"
                onChange={(e) => onChange({ form: e.target.files?.[0] })}
                required
                accept=".pdf,.doc,.docx,.jpg,.png,.heic"
              />
              <label
                htmlFor="form"
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <Upload className="h-5 w-5 mr-2 text-gray-400 group-hover:text-gray-600" />
                {formData.form ? formData.form.name : 'Загрузить документ'}
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit">
            Далее
          </Button>
        </div>
      </form>
    </div>
  );
}