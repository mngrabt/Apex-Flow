import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTenderStore } from '../../store/tender';
import { useRequestStore } from '../../store/request';
import { useSupplierApplicationStore } from '../../store/supplierApplication';
import { styles } from '../../utils/styleConstants';

interface AddSupplierFormProps {
  tenderId: string;
  onClose: () => void;
  currentUser: any;
}

export default function AddSupplierForm({ tenderId, onClose, currentUser }: AddSupplierFormProps) {
  const { addSupplier } = useTenderStore();
  const { requests } = useRequestStore();
  const { applications } = useSupplierApplicationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPricePerUnit, setIsPricePerUnit] = useState(true);
  
  // Get supplier data if current user is a supplier
  const supplierData = currentUser?.role === 'S' 
    ? applications.find(app => app.username === currentUser.username && app.status === 'approved')
    : null;

  const [formData, setFormData] = useState({
    companyName: currentUser?.role === 'S' ? supplierData?.companyName || '' : '',
    contactPerson: currentUser?.role === 'S' ? supplierData?.contactPerson || '' : '',
    contactNumber: currentUser?.role === 'S' ? supplierData?.contactNumber || '' : '',
    deliveryTime: '',
    pricePerUnit: '',
    price: '',
    includeTax: false
  });

  // Get the request quantity from the tender's request
  const tender = useTenderStore(state => state.tenders.find(t => t.id === tenderId));
  const request = requests.find(r => r.id === tender?.requestId);
  const requestQuantity = request?.items[0]?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !currentUser) return;

    try {
      setIsSubmitting(true);
      await addSupplier(tenderId, {
        companyName: currentUser?.role === 'S' ? supplierData?.companyName || '' : formData.companyName,
        contactPerson: currentUser?.role === 'S' ? supplierData?.contactPerson || '' : formData.contactPerson,
        contactNumber: currentUser?.role === 'S' ? supplierData?.contactNumber || '' : formData.contactNumber,
        deliveryTime: parseInt(formData.deliveryTime),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        price: parseFloat(formData.price),
        includeTax: formData.includeTax,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        proposalUrl: null
      });
      onClose();
    } catch (error) {
      console.error('Error adding supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Rest of your existing UI code...
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
                {currentUser?.role === 'S' ? 'Новое предложение' : 'Новый поставщик'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {currentUser?.role === 'S' 
                  ? 'Заполните информацию о вашем предложении'
                  : 'Заполните информацию о поставщике'
                }
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
                    value={currentUser?.role === 'S' ? supplierData?.companyName || '' : formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className={`${styles.input} ${currentUser?.role === 'S' 
                      ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                      : ''}`}
                    placeholder="ООО «Компания»"
                    aria-label="Название компании"
                    required
                    disabled={currentUser?.role === 'S'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Контактное лицо
                    </label>
                    <input
                      type="text"
                      value={currentUser?.role === 'S' ? supplierData?.contactPerson || '' : formData.contactPerson}
                      onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className={`${styles.input} ${currentUser?.role === 'S' 
                        ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                        : ''}`}
                      placeholder="Иван Иванов"
                      required
                      disabled={currentUser?.role === 'S'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Номер телефона
                    </label>
                    <input
                      type="tel"
                      value={currentUser?.role === 'S' ? supplierData?.contactNumber || '' : formData.contactNumber}
                      onChange={e => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className={`${styles.input} ${currentUser?.role === 'S' 
                        ? 'opacity-60 bg-gray-200 border-gray-300 text-gray-800 cursor-not-allowed select-none pointer-events-none shadow-inner' 
                        : ''}`}
                      placeholder="+998 90 123 45 67"
                      required
                      disabled={currentUser?.role === 'S'}
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
                  {isSubmitting ? 'Добавление...' : 'Добавить поставщика'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 