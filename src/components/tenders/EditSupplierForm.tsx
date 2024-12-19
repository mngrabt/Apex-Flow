import { useState } from 'react';
import { X } from 'lucide-react';
import { useTenderStore } from '../../store/tender';
import { useRequestStore } from '../../store/request';
import { useAuthStore } from '../../store/auth';
import { styles } from '../../utils/styleConstants';

interface EditSupplierFormProps {
  tenderId: string;
  supplierId: string;
  onClose: () => void;
}

export default function EditSupplierForm({
  tenderId,
  supplierId,
  onClose,
}: EditSupplierFormProps) {
  const { updateSupplier, getTenderById } = useTenderStore();
  const { requests } = useRequestStore();
  const user = useAuthStore(state => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPricePerUnit, setIsPricePerUnit] = useState(true);

  const tender = getTenderById(tenderId);
  const supplier = tender?.suppliers.find(s => s.id === supplierId);
  const request = requests.find(r => r.id === tender?.requestId);
  const requestQuantity = request?.items[0]?.quantity || 0;

  const [formData, setFormData] = useState({
    companyName: supplier?.companyName || '',
    contactPerson: supplier?.contactPerson || '',
    contactNumber: supplier?.contactNumber || '',
    deliveryTime: supplier?.deliveryTime || '',
    pricePerUnit: supplier?.pricePerUnit || '',
    price: supplier?.price || '',
    includeTax: supplier?.includeTax || false,
  });

  const calculatePriceWithTax = (price: number, includeTax: boolean) => {
    const result = includeTax ? price * 1.12 : price / 1.12;
    return Number(result.toFixed(1));
  };

  const handlePriceChange = (field: 'pricePerUnit' | 'price') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    let numericValue = parseFloat(value) || 0;
    numericValue = Number(numericValue.toFixed(1));
    
    if (field === 'pricePerUnit' && isPricePerUnit) {
      const priceWithTax = formData.includeTax ? numericValue : calculatePriceWithTax(numericValue, true);
      const totalPrice = Number((priceWithTax * requestQuantity).toFixed(1));
      setFormData(prev => ({
        ...prev,
        pricePerUnit: numericValue.toString(),
        price: totalPrice.toString()
      }));
    } else if (field === 'price' && !isPricePerUnit) {
      const priceWithTax = formData.includeTax ? numericValue : calculatePriceWithTax(numericValue, true);
      const pricePerUnit = requestQuantity ? Number((priceWithTax / requestQuantity).toFixed(1)) : 0;
      setFormData(prev => ({
        ...prev,
        price: numericValue.toString(),
        pricePerUnit: pricePerUnit.toString()
      }));
    }
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const includeTax = e.target.checked;
    const currentPricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const currentPrice = parseFloat(formData.price) || 0;

    const newPricePerUnit = calculatePriceWithTax(currentPricePerUnit, includeTax);
    const newPrice = calculatePriceWithTax(currentPrice, includeTax);

    setFormData(prev => ({
      ...prev,
      includeTax,
      pricePerUnit: newPricePerUnit.toString(),
      price: newPrice.toString()
    }));
  };

  const formatDisplayPrice = (value: string) => {
    if (!value) return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const digits = e.target.value.replace(/\D/g, '');
    
    // Format the number with spaces
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    
    setFormData(prev => ({ ...prev, contactNumber: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !user) return;

    // Check if user has permission to edit this supplier
    const canEdit = user.role === 'S' && supplier.createdBy === user.id ||
                   user.id === '00000000-0000-0000-0000-000000000001' && supplier.createdBy === user.id ||
                   user.id === '00000000-0000-0000-0000-000000000003' && supplier.createdBy === user.id;

    if (!canEdit) {
      setError('У вас нет прав на редактирование этого поставщика');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await updateSupplier(tenderId, supplierId, {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        deliveryTime: parseInt(formData.deliveryTime),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        price: parseFloat(formData.price),
        includeTax: formData.includeTax
      });
      onClose();
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError('Произошла ошибка при обновлении поставщика');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Редактировать поставщика
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Измените информацию о поставщике
              </p>
            </div>
            <button
              onClick={onClose}
              className="-mt-1 p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              {/* Company Info Section */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className={`${styles.input} ${user?.role === 'S' 
                      ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                      : ''}`}
                    placeholder="ООО «Компания»"
                    aria-label="Название компании"
                    required
                    disabled={user?.role === 'S'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Представитель
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className={`${styles.input} ${user?.role === 'S' 
                        ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                        : ''}`}
                      placeholder="Иван Иванов"
                      required
                      disabled={user?.role === 'S'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Номер телефона
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={handlePhoneNumberChange}
                      className={`${styles.input} ${user?.role === 'S' 
                        ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                        : ''}`}
                      placeholder="99 123 45 67"
                      required
                      disabled={user?.role === 'S'}
                    />
                  </div>
                </div>
              </div>

              {/* Price Info Section */}
              <div className="space-y-4">
                {/* Price Input Method Toggle */}
                <div className="flex items-center justify-center space-x-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPricePerUnit(true);
                      setFormData(prev => ({ 
                        ...prev, 
                        pricePerUnit: '', 
                        price: '',
                        includeTax: false 
                      }));
                    }}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all
                              ${isPricePerUnit
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                              }`}
                  >
                    Цена за единицу
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPricePerUnit(false);
                      setFormData(prev => ({ 
                        ...prev, 
                        pricePerUnit: '', 
                        price: '',
                        includeTax: false 
                      }));
                    }}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all
                              ${!isPricePerUnit
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                              }`}
                  >
                    Общая сумма
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {isPricePerUnit ? 'Цена за единицу' : 'Общая сумма'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatDisplayPrice(isPricePerUnit ? formData.pricePerUnit : formData.price)}
                        onChange={handlePriceChange(isPricePerUnit ? 'pricePerUnit' : 'price')}
                        className={`${styles.input} pr-12`}
                        placeholder="0"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-gray-400 text-sm">сум</span>
                      </div>
                    </div>
                    {!isPricePerUnit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Цена за единицу: {formatDisplayPrice(formData.pricePerUnit)} сум
                      </p>
                    )}
                    {isPricePerUnit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Общая сумма: {formatDisplayPrice(formData.price)} сум
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Срок поставки
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.deliveryTime}
                        onChange={e => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                        className="w-full h-12 px-4 pr-14 rounded-xl bg-gray-50 border border-gray-200
                               text-gray-900 placeholder:text-gray-400
                               focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10
                               transition-colors duration-200 outline-none
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="30"
                        min="1"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-gray-400 text-sm">дней</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center w-full h-14 px-4 rounded-xl border border-gray-200 
                                  bg-gray-50/50 cursor-pointer group">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={formData.includeTax}
                        onChange={handleTaxChange}
                        className="sr-only peer"
                      />
                      <div className="relative w-10 h-6 bg-gray-200 rounded-full 
                                  peer-focus:ring-2 peer-focus:ring-primary/20
                                  peer-checked:bg-primary transition-colors">
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm
                                    transition-transform duration-200 ease-in-out
                                    peer-checked:translate-x-4"></div>
                      </div>
                      <div className="flex flex-col ml-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formData.includeTax ? 'НДС включен' : 'Без НДС'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formData.includeTax ? '+12% к сумме' : 'НДС не включен в сумму'}
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
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
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-8 pb-6">
                <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}