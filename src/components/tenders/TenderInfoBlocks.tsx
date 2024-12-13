import { Download } from 'lucide-react';
import { TransferRequestItem } from '../../types';

interface TenderInfoBlocksProps {
  item: TransferRequestItem & {
    deadline: number;
    objectType: 'office' | 'construction';
  };
  documentUrl?: string;
}

interface InfoBlockProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

const InfoBlock = ({ label, value, icon }: InfoBlockProps) => (
  <div className="flex flex-col bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
    <div className="flex items-center space-x-3 mb-2">
      {icon && <div className="text-gray-400">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
);

export default function TenderInfoBlocks({
  item,
  documentUrl
}: TenderInfoBlocksProps) {
  const getObjectTypeLabel = (type: 'office' | 'construction') => {
    return type === 'office' ? 'Офис' : 'Стройка';
  };

  return (
    <div className="space-y-6">
      {/* Primary info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoBlock
          label="Количество"
          value={`${item.quantity} ${item.unitType}`}
        />
        <InfoBlock
          label="Тип объекта"
          value={getObjectTypeLabel(item.objectType)}
        />
      </div>

      {/* Document download */}
      {documentUrl && (
        <div className="mt-8">
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Документ</p>
              <p className="text-base font-semibold text-gray-900">Скачать техническое задание</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <Download className="h-5 w-5" />
            </div>
          </a>
        </div>
      )}
    </div>
  );
}