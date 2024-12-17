import { useState } from 'react';
import { X } from 'lucide-react';
import { useTenderStore } from '../../store/tender';
import { useAuthStore } from '../../store/auth';
import { Supplier } from '../../types';
import { styles } from '../../utils/styleConstants';

interface SupplierFormProps {
  tenderId: string;
  supplier?: Supplier;
  onClose: () => void;
}

interface SupplierFormData {
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  pricePerUnit: number | string;
  price: number | string;
  deliveryTime: number | string;
  includeTax: boolean;
}

export default function SupplierForm({ tenderId, supplier, onClose }: SupplierFormProps) {
  const user = useAuthStore(state => state.user);
  const { addSupplier, updateSupplier } = useTenderStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: supplier?.companyName || '',
    contactPerson: supplier?.contactPerson || '',
    contactNumber: supplier?.contactNumber || '',
    pricePerUnit: supplier?.pricePerUnit || '',
    price: supplier?.price || '',
    deliveryTime: supplier?.deliveryTime || '',
    includeTax: supplier?.includeTax || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      const supplierData = {
        ...formData,
        pricePerUnit: Number(formData.pricePerUnit),
        price: Number(formData.price),
        deliveryTime: Number(formData.deliveryTime),
        createdBy: supplier?.createdBy || user.id,
        createdAt: supplier?.createdAt || new Date().toISOString()
      };

      if (supplier) {
        await updateSupplier(tenderId, supplier.id, supplierData);
      } else {
        await addSupplier(tenderId, supplierData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceChange = (field: 'pricePerUnit') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value ? Number(value.replace(/[^0-9]/g, '')) : '';
    
    setFormData(prev => {
      const newData = { ...prev, [field]: numValue };
      const price = Number(newData.pricePerUnit);
      return { ...newData, price: isNaN(price) ? '' : price };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          <div className="bg-white rounded-t-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {supplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Заполните информацию о поставщике
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 
                         rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="space-y-8">
                {/* Company Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Название компании
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className={styles.input}
                      placeholder="ООО «Компания»"
                      aria-label="Название компании"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Представитель
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className={styles.input}
                        placeholder="Введите имя"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Номер телефона
                      </label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                        className={styles.input}
                        placeholder="+998 __ ___ __ __"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="pt-6 space-y-6 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Цена за единицу
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="text"
                          value={formData.pricePerUnit ? Number(formData.pricePerUnit).toLocaleString() : ''}
                          onChange={handlePriceChange('pricePerUnit')}
                          className={styles.input}
                          placeholder="0"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">сум</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Общая сумма
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="text"
                          value={formData.price ? Number(formData.price).toLocaleString() : ''}
                          className={`${styles.input} bg-gray-100/80 cursor-not-allowed`}
                          disabled
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">сум</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-6 space-y-6 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Срок поставки
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          value={formData.deliveryTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                          className={styles.input}
                          placeholder="0"
                          min="1"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">дней</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        НДС
                      </label>
                      <div className="relative mt-2">
                        <label className="flex items-center w-full h-12 px-4 rounded-xl border border-gray-200 
                                      bg-gray-50/50 cursor-pointer group">
                          <div className="flex items-center flex-1">
                            <input
                              type="checkbox"
                              checked={formData.includeTax}
                              onChange={(e) => setFormData(prev => ({ ...prev, includeTax: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="relative w-9 h-5 bg-gray-200 rounded-full 
                                        peer-focus:ring-2 peer-focus:ring-primary/20
                                        peer-checked:bg-primary transition-colors">
                              <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow-sm
                                          transition-transform duration-200 ease-in-out
                                          peer-checked:translate-x-4"></div>
                            </div>
                            <div className="flex flex-col ml-3">
                              <span className="text-sm font-medium text-gray-900">
                                {formData.includeTax ? 'Включен' : 'Не включен'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formData.includeTax ? '+12% к сумме' : 'Без НДС'}
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 mt-8 -mx-6 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
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
                  {isSubmitting ? 'Сохранение...' : supplier ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}