import { Protocol } from '../../../types';
import { format } from 'date-fns';

interface InfoBlockProps {
  label: string;
  value: string;
}

const InfoBlock = ({ label, value }: InfoBlockProps) => (
  <div className="bg-gray-50 rounded-2xl p-4 text-center">
    <div className="text-sm font-medium text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

interface ProtocolListItemProps {
  protocol: Protocol;
  requestName: string;
  onClick: () => void;
  onUpdate?: () => void;
}

export default function ProtocolListItem({ 
  protocol, 
  requestName,
  onClick,
  onUpdate
}: ProtocolListItemProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer"
    >
      {/* Content */}
      <div className="relative space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                {requestName}
              </h3>
            </div>
          </div>
          {protocol.description && (
            <p className="text-sm text-gray-500">{protocol.description}</p>
          )}
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-2 max-[1249px]:grid-cols-1 gap-4">
          <InfoBlock
            label="Создан"
            value={format(new Date(protocol.createdAt), 'dd.MM.yy')}
          />
          <InfoBlock
            label="Подписей"
            value={`${(protocol.signatures || []).length}/4`}
          />
        </div>

        {/* Document */}
        {protocol.documentUrl && (
          <a
            href={protocol.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors text-center block"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-900">Скачать</div>
            <div className="text-xs text-gray-500 mt-1">Документация</div>
          </a>
        )}
      </div>
    </div>
  );
}