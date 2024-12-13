import React from 'react';
import { Tag, Download } from 'lucide-react';
import { ArchivedProtocol } from '../../../types';
import { useArchiveStore } from '../../../store/archive';
import { styles } from '../../../utils/styleConstants';
import { format } from 'date-fns';

interface Props {
  protocol: ArchivedProtocol;
}

export const ArchiveListItem: React.FC<Props> = ({ protocol }) => {
  const { downloadArchive } = useArchiveStore();

  const handleDownload = async () => {
    try {
      await downloadArchive(protocol, `protocol_${protocol.id}.zip`);
    } catch (error) {
      console.error('Error downloading archive:', error);
    }
  };

  const item = protocol.tender?.request?.items[0];
  if (!item) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <p className="text-gray-500 font-semibold">{item.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400 font-bold">
              {format(new Date(protocol.createdAt), 'dd.MM.yy')}
            </span>
            <button
              onClick={handleDownload}
              aria-label="Скачать архив"
              className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        {protocol.tender?.request?.categories && protocol.tender.request.categories.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {protocol.tender.request.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Info Blocks */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Количество</h4>
            <p className={styles.text.body}>{item.quantity} {item.unitType}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Срок поставки</h4>
            <p className={styles.text.body}>{item.deadline} дней</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Тип объекта</h4>
            <p className={styles.text.body}>{item.objectType === 'office' ? 'Офис' : 'Стройка'}</p>
          </div>
          {protocol.tender?.request?.documentUrl && (
            <button
              onClick={() => window.open(protocol.tender.request.documentUrl, '_blank')}
              className="bg-gray-50 rounded-xl p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Техническое</h4>
              <p className={styles.text.body}>Задание</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 