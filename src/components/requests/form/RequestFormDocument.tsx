import { Upload } from 'lucide-react';
import { styles } from '../../../utils/styleConstants';

interface RequestFormDocumentProps {
  document?: File;
  documentUrl?: string;
  onChange: (file: File | undefined) => void;
}

export default function RequestFormDocument({ document, documentUrl, onChange }: RequestFormDocumentProps) {
  return (
    <div>
      <label className={`block ${styles.text.label} mb-2`}>
        ТЗ
      </label>
      <div className="relative">
        <input
          type="file"
          id="document-upload"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
          accept=".pdf,.doc,.docx,.jpg,.png,.heic"
        />
        <label
          htmlFor="document-upload"
          className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors cursor-pointer group"
        >
          <Upload className="h-5 w-5 mr-2 text-gray-400 group-hover:text-gray-600" />
          {document ? document.name : documentUrl ? 'Заменить документ' : 'Прикрепить документ'}
        </label>
        {documentUrl && !document && (
          <div className="mt-2 text-sm text-gray-500">
            Текущий документ: <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Открыть</a>
          </div>
        )}
      </div>
    </div>
  );
}