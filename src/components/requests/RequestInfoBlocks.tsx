import { RequestItem } from '../../types';

interface RequestInfoBlocksProps {
  item: RequestItem;
  documentUrl: string | undefined;
}

export default function RequestInfoBlocks({ item, documentUrl }: RequestInfoBlocksProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gray-100 rounded-lg p-3.5">
        <div className="-space-y-1">
          <span className="text-sm text-gray-500 font-bold">Лот</span>
          <p className="text-3xl font-bold text-gray-900">
            {item.objectType === 'office' ? 'Офис' : 'Стройка'}
          </p>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-3.5">
        <div className="-space-y-1">
          <span className="text-sm text-gray-500 font-bold">Количество</span>
          <p className="text-3xl font-bold text-gray-900">
            {item.quantity} {item.unitType}
          </p>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-3.5">
        <div className="-space-y-1">
          <span className="text-sm text-gray-500 font-bold">Срок поставки</span>
          <p className="text-3xl font-bold text-gray-900">
            {item.deadline} дней
          </p>
        </div>
      </div>
      {documentUrl ? (
        <button
          onClick={() => window.open(documentUrl, '_blank')}
          className="bg-gray-100 rounded-lg p-3.5 text-left hover:bg-[#ff6b00]/10 transition-colors group"
        >
          <div className="-space-y-1">
            <span className="text-sm text-gray-500 font-bold group-hover:text-[#ff6b00]">
              Техническое
            </span>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-[#ff6b00]">
              Задание
            </p>
          </div>
        </button>
      ) : (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="-space-y-1">
            <span className="text-sm text-gray-500 font-bold">Техническое</span>
            <p className="text-2xl font-bold text-gray-900">
              Задание
            </p>
          </div>
        </div>
      )}
    </div>
  );
}