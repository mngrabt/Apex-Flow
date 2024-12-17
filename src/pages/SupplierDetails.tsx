import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Bell, BellOff, FileText, Trash2, ExternalLink, X } from 'lucide-react';
import { useSupplierStore } from '../store/supplier';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { styles } from '../utils/styleConstants';
import { Modal } from '../components/shared';

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { suppliers, fetchSuppliers, toggleNotifications, deleteSupplier } = useSupplierStore();
  const supplier = suppliers.find(s => s.id === id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSupplier(supplier?.id as string);
      navigate('/database');
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actions (Mobile) */}
        <div className="lg:hidden bg-white rounded-2xl p-8 shadow-sm">
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

        {/* Left Column */}
        <div className="space-y-8">
          {/* Company Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Данные организации</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Название организации</div>
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

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Контактная информация</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Представитель</div>
                  <div className="font-medium text-gray-900">{supplier.contactPerson || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Телефон</div>
                  <div className="font-medium text-gray-900">{formatPhoneNumber(supplier.phone)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tender Statistics */}
          {tenderCount > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Статистика участия в тендерах</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Documents (Mobile) */}
          <div className="lg:hidden bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Документы</h2>
            <div className="space-y-3">
              {supplier.vatCertificateUrl && (
                <button
                  onClick={() => window.open(supplier.vatCertificateUrl, '_blank')}
                  className="flex items-center space-x-4 w-full p-4 bg-gray-50/50 backdrop-blur
                           rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Сертификат НДС
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-primary/80 transition-colors">
                      Скачать документ
                    </p>
                  </div>
                </button>
              )}
              {supplier.licenseUrl && (
                <button
                  onClick={() => window.open(supplier.licenseUrl, '_blank')}
                  className="flex items-center space-x-4 w-full p-4 bg-gray-50/50 backdrop-blur
                           rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Гувохнома
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-primary/80 transition-colors">
                      Скачать документ
                    </p>
                  </div>
                </button>
              )}
              {supplier.passportUrl && (
                <button
                  onClick={() => window.open(supplier.passportUrl, '_blank')}
                  className="flex items-center space-x-4 w-full p-4 bg-gray-50/50 backdrop-blur
                           rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Паспорт
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-primary/80 transition-colors">
                      Скачать документ
                    </p>
                  </div>
                </button>
              )}
              {supplier.formUrl && (
                <button
                  onClick={() => window.open(supplier.formUrl, '_blank')}
                  className="flex items-center space-x-4 w-full p-4 bg-gray-50/50 backdrop-blur
                           rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Анкета
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-primary/80 transition-colors">
                      Скачать документ
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Desktop Only */}
        <div className="hidden lg:block space-y-8">
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Удаление поставщика
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Это действие нельзя отменить
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="-mt-1 p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Вы уверены, что хотите удалить поставщика <span className="font-medium">{supplier.name}</span>? Все данные, связанные с этим поставщиком, будут удалены.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-gray-700
                             bg-white border border-gray-200 hover:bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-primary/20
                             transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-white
                             bg-primary hover:bg-primary/90 
                             focus:outline-none focus:ring-2 focus:ring-primary/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors inline-flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Удаление...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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