import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { useRequestStore } from '../../store/request';
import { X, Upload, ChevronDown, Check } from 'lucide-react';
import { User } from '../../types';
import { styles } from '../../utils/styleConstants';
import { SUPPLIER_CATEGORIES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';

interface RequestFormProps {
  onClose: (saved: boolean) => void;
  initialData?: {
    name: string;
    description: string;
    documentUrl?: string;
    taskId?: string;
  };
}

type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected';
type RequestType = 'transfer' | 'cash';
type ObjectType = 'office' | 'construction';

export default function RequestForm({ onClose, initialData }: RequestFormProps) {
  const user = useAuthStore((state) => state.user) as User | null;
  const { addRequest } = useRequestStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<RequestType>('transfer');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [transferFormData, setTransferFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    objectType: 'office' as ObjectType,
    unitType: 'шт',
    quantity: 0,
    deadline: 0,
    categories: [] as string[],
    document: null as File | null,
  });

  const [cashFormData, setCashFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    quantity: 0,
    totalSum: 0,
    document: null as File | null,
  });

  // Handle click outside for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose(false);
    }
  };

  // Category handlers
  const filteredCategories = SUPPLIER_CATEGORIES.filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCategoryToggle = (category: string) => {
    setTransferFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // File upload handler
  const handleFileChange = (file: File | undefined) => {
    if (requestType === 'transfer') {
      setTransferFormData(prev => ({ ...prev, document: file || null }));
    } else {
      setCashFormData(prev => ({ ...prev, document: file || null }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      let documentUrl: string | undefined = undefined;

      // Handle file upload if a file is selected
      const file = requestType === 'transfer' ? transferFormData.document : cashFormData.document;
      if (file) {
        try {
          // Create a unique file name
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `requests/${fileName}`;

          // Upload file to storage
          const { error: uploadError, data } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

          documentUrl = publicUrl;
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error('Ошибка при загрузке файла');
        }
      }

      if (requestType === 'transfer') {
        if (transferFormData.categories.length === 0) {
          throw new Error('Выберите хотя бы одну категорию');
        }

        await addRequest({
          type: 'transfer',
          status: 'draft' as RequestStatus,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString(),
          department: user.name || '',
          categories: transferFormData.categories,
          items: [{
            id: crypto.randomUUID(),
            name: transferFormData.name,
            description: transferFormData.description,
            objectType: transferFormData.objectType,
            unitType: transferFormData.unitType,
            quantity: transferFormData.quantity,
            deadline: transferFormData.deadline,
          }],
          documentUrl,
          createdBy: user.id,
          taskId: initialData?.taskId,
        });
      } else {
        if (cashFormData.totalSum <= 0) {
          throw new Error('Общая сумма должна быть больше нуля');
        }

        await addRequest({
          type: 'cash',
          status: 'draft' as RequestStatus,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString(),
          department: user.name || '',
          items: [{
            id: crypto.randomUUID(),
            name: cashFormData.name,
            description: cashFormData.description,
            quantity: cashFormData.quantity,
            totalSum: cashFormData.totalSum,
          }],
          documentUrl,
          createdBy: user.id,
          taskId: initialData?.taskId,
        });
      }

      onClose(true);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={handleBackdropClick}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Новая заявка
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Заполните информацию о заявке
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              className="-mt-1 p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              {/* Type Selector */}
              <div className="flex items-center justify-center">
                <nav className="inline-flex p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRequestType('transfer')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${requestType === 'transfer'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Перечисление
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('cash')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${requestType === 'cash'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Наличные
                  </button>
                </nav>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {requestType === 'transfer' ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Наименование
                      </label>
                      <input
                        type="text"
                        value={transferFormData.name}
                        onChange={(e) => setTransferFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 placeholder:text-gray-400 
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        placeholder="Введите наименование"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Описание
                      </label>
                      <textarea
                        value={transferFormData.description}
                        onChange={(e) => setTransferFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 placeholder:text-gray-400 resize-none
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        placeholder="Опишите требуемые товары или услуги"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Категории
                      </label>
                      <div className="relative" ref={categoryDropdownRef}>
                        {transferFormData.categories.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {transferFormData.categories.map(category => (
                              <span
                                key={category}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs"
                              >
                                {category}
                                <button
                                  type="button"
                                  onClick={() => handleCategoryToggle(category)}
                                  className="p-0.5 hover:bg-primary/10 rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Dropdown Button */}
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className="flex items-center justify-between w-full h-11 px-4 bg-gray-50 border border-gray-200 
                                   rounded-xl text-gray-900 hover:bg-gray-100/80 transition-colors"
                        >
                          <span className={transferFormData.categories.length === 0 ? 'text-gray-400' : ''}>
                            {transferFormData.categories.length === 0 
                              ? 'Выберите категории' 
                              : 'Добавить категорию'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isCategoryDropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                            <div className="p-2">
                              <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder="Поиск категорий..."
                                className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm 
                                         placeholder:text-gray-400
                                         focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                         transition-colors duration-200 outline-none"
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCategories.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  Ничего не найдено
                                </div>
                              ) : (
                                filteredCategories.map(category => (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => handleCategoryToggle(category)}
                                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-900 
                                             hover:bg-gray-50"
                                  >
                                    <span>{category}</span>
                                    {transferFormData.categories.includes(category) && (
                                      <Check className="w-4 h-4 text-primary" />
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Тип объекта
                      </label>
                      <select
                        value={transferFormData.objectType}
                        onChange={(e) => setTransferFormData(prev => ({ 
                          ...prev, 
                          objectType: e.target.value as ObjectType 
                        }))}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 appearance-none cursor-pointer
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        required
                      >
                        <option value="office">Офис</option>
                        <option value="construction">Стройка</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Единица измерения
                      </label>
                      <select
                        value={transferFormData.unitType}
                        onChange={(e) => setTransferFormData(prev => ({ ...prev, unitType: e.target.value }))}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 appearance-none cursor-pointer
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        required
                      >
                        <option value="шт">штук (шт)</option>
                        <option value="м²">квадратных метров (м²)</option>
                        <option value="л">литров (л)</option>
                        <option value="кг">килограмм (кг)</option>
                        <option value="м">метров (м)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Количество
                      </label>
                      <input
                        type="number"
                        value={transferFormData.quantity || ''}
                        onChange={(e) => setTransferFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        required
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 placeholder:text-gray-400
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Срок поставки
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={transferFormData.deadline || ''}
                          onChange={(e) => setTransferFormData(prev => ({ ...prev, deadline: parseInt(e.target.value) || 0 }))}
                          required
                          className="w-full h-12 px-4 pr-14 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                   placeholder:text-gray-400
                                   focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                   transition-colors duration-200 outline-none
                                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="30"
                          min="1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-400 text-sm">дней</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Техническое задание
                    </label>
                    <div>
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTransferFormData(prev => ({ ...prev, document: file }));
                          }
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.png,.heic"
                      />
                      {transferFormData.document ? (
                        <div className="flex items-center justify-between w-full h-12 px-4 bg-gray-50/50 border border-gray-200 
                                      rounded-xl text-gray-900 group">
                          <div className="flex items-center min-w-0">
                            <Upload className="h-4 w-4 mr-3 text-primary flex-shrink-0" />
                            <span className="text-sm truncate">
                              {transferFormData.document.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTransferFormData(prev => ({ ...prev, document: null }))}
                            className="ml-3 p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100/80 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="document-upload"
                          className="flex items-center justify-center w-full h-12 px-4 bg-white border border-dashed 
                                   border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5
                                   transition-colors cursor-pointer group"
                        >
                          <Upload className="h-4 w-4 mr-3 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">
                            Нажмите чтобы загрузить файл
                          </span>
                        </label>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG или HEIC до 10MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Наименование
                      </label>
                      <input
                        type="text"
                        value={cashFormData.name}
                        onChange={(e) => setCashFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 placeholder:text-gray-400
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        placeholder="Введите наименование"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Описание
                      </label>
                      <textarea
                        value={cashFormData.description}
                        onChange={(e) => setCashFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                 placeholder:text-gray-400 resize-none
                                 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                 transition-colors duration-200 outline-none"
                        placeholder="Опишите требуемые товары или услуги"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                          Количество
                        </label>
                        <input
                          type="number"
                          value={cashFormData.quantity || ''}
                          onChange={(e) => setCashFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                          required
                          className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                   placeholder:text-gray-400
                                   focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                   transition-colors duration-200 outline-none
                                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                          Общая сумма
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={cashFormData.totalSum || ''}
                            onChange={(e) => setCashFormData(prev => ({ ...prev, totalSum: parseInt(e.target.value) || 0 }))}
                            required
                            className="w-full h-12 px-4 pr-14 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 
                                     placeholder:text-gray-400
                                     focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 
                                     transition-colors duration-200 outline-none
                                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <span className="text-gray-400 text-sm">сум</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Документ
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                        className="hidden"
                        id="document-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <label
                        htmlFor="document-upload"
                        className="flex items-center gap-2 px-4 h-12 bg-gray-50 border border-gray-200 rounded-xl 
                                 text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Загрузить документ</span>
                      </label>
                      {(requestType === 'transfer' ? transferFormData.document : cashFormData.document) && (
                        <div className="flex-1 truncate text-sm text-gray-500">
                          {(requestType === 'transfer' ? transferFormData.document : cashFormData.document)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="h-12 px-6 rounded-xl text-sm font-medium text-gray-700 
                           bg-white border border-gray-200 hover:bg-gray-50 
                           focus:outline-none focus:ring-2 focus:ring-primary/20 
                           transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-xl text-sm font-medium text-white 
                           bg-primary hover:bg-primary/90 
                           focus:outline-none focus:ring-2 focus:ring-primary/20 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-colors"
                >
                  {isSubmitting ? 'Сохранение...' : 'Создать'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}