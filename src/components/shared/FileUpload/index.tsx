import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
}

export default function FileUpload({ 
  onUpload, 
  isUploading = false,
  accept = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}: FileUploadProps) {
  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
        disabled={isUploading}
      />
      <label
        htmlFor="file-upload"
        className={`
          inline-flex items-center gap-2 px-4 py-2 
          bg-primary/10 text-primary rounded-lg text-sm font-medium 
          hover:bg-primary/20 active:bg-primary/30
          transition-all duration-200 cursor-pointer
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Загрузка...' : 'Загрузить предложение'}
      </label>
    </div>
  );
} 