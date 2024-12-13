import { useState, useEffect } from 'react';
import { ChevronLeft, Download, Building2, Mail, Phone, FileText, User, Hash, Trash2 } from 'lucide-react';
import { useSupplierStore } from '../../store/supplier';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ConfirmModal from '../shared/ConfirmModal';

interface SupplierDetailsProps {
  supplierId: string;
  onBack: () => void;
}

export default function SupplierDetails({ supplierId, onBack }: SupplierDetailsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { suppliers, deleteSupplier, toggleNotifications } = useSupplierStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supplier = suppliers.find(s => s.id === supplierId);

  // Set state to indicate we're in supplier details
  useEffect(() => {
    navigate('.', { state: { isSupplierDetails: true }, replace: true });
    return () => {
      navigate('.', { state: { isSupplierDetails: false }, replace: true });
    };
  }, [navigate]);

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Поставщик не найден</p>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSupplier(supplier.id);
      navigate('/database');
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 
                   mb-8 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Назад к базе данных
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {supplier.name}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories?.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full 
                                 bg-primary/10 text-primary text-sm font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent 
                               bg-gradient-to-r from-gray-900 to-gray-600">
                    Статистика
                  </h2>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    За все время
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatBlock
                    label="Участие в тендерах"
                    value={supplier.tenderCount || 0}
                  />
                  <StatBlock
                    label="Выигранные тендеры"
                    value={supplier.wonTenderCount || 0}
                    percentage={supplier.tenderCount ? ((supplier.wonTenderCount || 0) / supplier.tenderCount * 100).toFixed(0) : "0"}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Контактная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBlock
                  label="Контактное лицо"
                  value={supplier.contactPerson}
                />
                <InfoBlock
                  label="Телефон"
                  value={supplier.phone}
                />
                <InfoBlock
                  label="Email"
                  value={supplier.email}
                />
                <InfoBlock
                  label="ИНН"
                  value={supplier.inn || '-'}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Action Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Действия
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleNotifications(supplier.id)}
                      className={`w-full flex items-center justify-center px-4 py-2.5 
                               ${supplier.notificationsEnabled 
                                 ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                 : 'bg-primary/10 hover:bg-primary/20 text-primary'
                               }
                               rounded-xl font-medium transition-colors`}
                    >
                      {supplier.notificationsEnabled ? 'Отключить уведомления' : 'Включить уведомления'}
                    </button>
                    <button
                      onClick={handleDelete}
                      aria-label="Удалить поставщика"
                      className="w-full flex items-center justify-center px-4 py-2.5 
                               bg-primary/10 hover:bg-primary/20 text-primary
                               rounded-xl font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Документы
                </h3>
                <div className="space-y-3">
                  {supplier.vatCertificateUrl && (
                    <DocumentBlock
                      label="Сертификат НДС"
                      url={supplier.vatCertificateUrl}
                    />
                  )}
                  {supplier.licenseUrl && (
                    <DocumentBlock
                      label="Гувохнома"
                      url={supplier.licenseUrl}
                    />
                  )}
                  {supplier.passportUrl && (
                    <DocumentBlock
                      label="Паспорт"
                      url={supplier.passportUrl}
                    />
                  )}
                  {supplier.formUrl && (
                    <DocumentBlock
                      label="Анкета"
                      url={supplier.formUrl}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          title="Удалить поставщика"
          message="Вы уверены, что хотите удалить этого поставщика? Это действие нельзя отменить."
          confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          isDestructive
          isDisabled={isDeleting}
        />
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50/50 backdrop-blur rounded-xl p-4 space-y-2 text-center">
      <h4 className="text-sm font-medium text-gray-500">{label}</h4>
      <p className="text-base font-medium text-gray-900">{value}</p>
    </div>
  );
}

function DocumentBlock({ label, url }: { label: string; url: string }) {
  return (
    <button
      onClick={() => window.open(url, '_blank')}
      className="flex items-center space-x-4 w-full p-4 bg-gray-50/50 backdrop-blur
                 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
    >
      <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
        <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 text-left">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
          {label}
        </h4>
        <p className="text-sm text-gray-500 group-hover:text-primary/80 transition-colors">
          Скачать документ
        </p>
      </div>
    </button>
  );
}

function StatBlock({ label, value, percentage }: { label: string; value: number; percentage?: string }) {
  return (
    <div className="relative overflow-hidden bg-gray-50/50 backdrop-blur rounded-2xl p-6 
                    transition-all duration-300 hover:bg-gray-50/70 group">
      <div className="relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold bg-clip-text text-transparent 
                           bg-gradient-to-r from-gray-900 to-gray-600">
              {value}
            </span>
            {percentage && (
              <span className="text-sm font-medium text-gray-500">
                ({percentage}%)
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}