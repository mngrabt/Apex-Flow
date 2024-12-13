import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Bell, BellOff, FileText, Trash2, ExternalLink } from 'lucide-react';
import { useSupplierStore } from '../store/supplier';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { styles } from '../utils/styleConstants';

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { suppliers, fetchSuppliers, toggleNotifications } = useSupplierStore();
  const supplier = suppliers.find(s => s.id === id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchSuppliers();
      } catch (error) {
        console.error('Error loading supplier:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!isLoading && !supplier) {
      navigate('/database');
    }
  }, [supplier, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F7]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  const formatInn = (inn: string | undefined | null): string => {
    if (!inn) return '-';
    const digitsOnly = inn.replace(/\D/g, '');
    let formatted = '';
    if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 3);
    if (digitsOnly.length > 3) formatted += ' ' + digitsOnly.slice(3, 6);
    if (digitsOnly.length > 6) formatted += ' ' + digitsOnly.slice(6, 9);
    return formatted;
  };

  const formatPhoneNumber = (phone: string | undefined | null): string => {
    if (!phone) return '-';
    const digitsOnly = phone.replace(/\D/g, '');
    let formatted = '';
    if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 2);
    if (digitsOnly.length > 2) formatted += ' ' + digitsOnly.slice(2, 5);
    if (digitsOnly.length > 5) formatted += ' ' + digitsOnly.slice(5, 7);
    if (digitsOnly.length > 7) formatted += ' ' + digitsOnly.slice(7, 9);
    return formatted;
  };

  const calculateSuccessRate = (won: number | undefined | null, total: number | undefined | null): number => {
    const wonCount = won || 0;
    const totalCount = total || 0;
    if (totalCount === 0) return 0;
    return Math.round((wonCount / totalCount) * 100);
  };

  const tenderCount = supplier.tenderCount || 0;
  const wonTenderCount = supplier.wonTenderCount || 0;
  const successRate = calculateSuccessRate(wonTenderCount, tenderCount);

  // Add debug logging
  console.log('Supplier tender stats:', {
    supplier: supplier.name,
    tenderCount,
    wonTenderCount,
    successRate,
    rawTenderCount: supplier.tenderCount,
    rawWonTenderCount: supplier.wonTenderCount
  });

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/database')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {supplier.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Добавлен {format(new Date(supplier.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Поставщик
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Company Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Информация о компании</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Название компании</div>
                  <div className="font-medium text-gray-900">{supplier.name || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">ИНН</div>
                  <div className="font-medium text-gray-900">{formatInn(supplier.inn)}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Категории</div>
                <div className="flex flex-wrap gap-2">
                  {supplier.categories?.map((category, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tender Statistics */}
          {tenderCount > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Статистика участия в тендерах</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Всего тендеров</div>
                  <div className="font-medium text-gray-900">{tenderCount}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Выигранные тендеры</div>
                  <div className="font-medium text-gray-900">
                    {wonTenderCount}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">
                    Успешность участия в тендерах
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {successRate}%
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Контактная информация</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                  <div className="font-medium text-gray-900">{supplier.contactPerson || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Телефон</div>
                  <div className="font-medium text-gray-900">{formatPhoneNumber(supplier.phone)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Actions */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Действия</h2>
            <div className="space-y-3">
              <button
                onClick={() => toggleNotifications(supplier.id)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 
                         ${supplier.notificationsEnabled 
                           ? 'bg-gray-50 hover:bg-gray-100 text-gray-900' 
                           : 'bg-primary text-white hover:bg-primary/90'
                         }
                         rounded-xl font-medium transition-colors`}
              >
                {supplier.notificationsEnabled ? (
                  <>
                    <BellOff className="w-5 h-5" />
                    Отключить уведомления
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Включить уведомления
                  </>
                )}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                         bg-primary text-white rounded-xl font-medium
                         hover:bg-primary/90 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Удалить поставщика
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Документы</h2>
            <div className="space-y-3">
              {supplier.vatCertificateUrl && (
                <DocumentLink
                  label="Сертификат НДС"
                  url={supplier.vatCertificateUrl}
                />
              )}
              {supplier.licenseUrl && (
                <DocumentLink
                  label="Гувохнома"
                  url={supplier.licenseUrl}
                />
              )}
              {supplier.passportUrl && (
                <DocumentLink
                  label="Паспорт"
                  url={supplier.passportUrl}
                />
              )}
              {supplier.formUrl && (
                <DocumentLink
                  label="Анкета"
                  url={supplier.formUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <Modal
          title="Удаление поставщика"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="p-6">
            <p className="text-gray-700">
              Вы уверены, что хотите удалить этого поставщика? Это действие нельзя отменить.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DocumentLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl 
               hover:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
          {label}
        </span>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
    </a>
  );
} 