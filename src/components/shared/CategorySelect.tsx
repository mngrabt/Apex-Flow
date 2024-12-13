import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { styles } from '../../utils/styleConstants';
import { SUPPLIER_CATEGORIES } from '../../utils/constants';

interface CategorySelectProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  label?: string;
  required?: boolean;
}

export default function CategorySelect({
  selectedCategories = [],
  onChange,
  label = 'Категории',
  required = false
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onChange(newCategories);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className={`block ${styles.text.label} mb-2`}>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.components.input} min-h-[42px] cursor-pointer flex flex-wrap gap-2 items-center ${
          selectedCategories.length === 0 ? 'text-gray-400' : ''
        }`}
      >
        {selectedCategories.length === 0 ? (
          <span>Выберите категории</span>
        ) : (
          selectedCategories.map(category => (
            <span
              key={category}
              className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category);
              }}
            >
              {category}
              <X className="h-4 w-4 ml-1.5 hover:text-primary/80" />
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-2 max-h-60 overflow-y-auto">
          {SUPPLIER_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                selectedCategories.includes(category) ? 'text-primary font-medium' : 'text-gray-700'
              }`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}