import { styles } from '../../../utils/styleConstants';

export type RequestType = 'transfer' | 'cash';

interface RequestTypeSelectorProps {
  value: RequestType;
  onChange: (type: RequestType) => void;
}

export default function RequestTypeSelector({ value, onChange }: RequestTypeSelectorProps) {
  return (
    <div className="flex justify-center mb-8">
      <nav className="bg-gray-50/80 rounded-2xl p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange('transfer')}
            className={`relative px-8 py-3.5 rounded-xl text-base font-medium transition-colors duration-200
              ${value === 'transfer'
                ? 'text-gray-700 bg-white'
                : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
              }`}
          >
            <span className="relative">Заявка на перечисление</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('cash')}
            className={`relative px-8 py-3.5 rounded-xl text-base font-medium transition-colors duration-200
              ${value === 'cash'
                ? 'text-gray-700 bg-white'
                : 'text-gray-500 hover:text-gray-600 hover:bg-white/50'
              }`}
          >
            <span className="relative">Заявка на наличные</span>
          </button>
        </div>
      </nav>
    </div>
  );
} 