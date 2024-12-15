import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  User2, 
  Mail, 
  Phone, 
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useSupplierApplicationStore } from '../../store/supplierApplication';
import { Modal } from '../shared';
import { styles } from '../../utils/styleConstants';

export default function ApplicationDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const { applications, fetchApplications, reviewApplication } = useSupplierApplicationStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchApplications();
      } catch (error) {
        console.error('Error loading application:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchApplications]);

  if (!user || !id) return null;

  const application = applications.find(app => app.id === id);
  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg font-medium text-gray-900">Заявление не найдено</div>
        <button
          onClick={() => navigate('/applications')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      await reviewApplication(application.id, true, '', user.id);
      navigate('/applications');
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      await reviewApplication(application.id, false, rejectReason.trim(), user.id);
      setIsRejectModalOpen(false);
      navigate('/applications');
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatInn = (inn: string) => {
    const digitsOnly = inn.replace(/\D/g, '');
    let formatted = '';
    if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 3);
    if (digitsOnly.length > 3) formatted += ' ' + digitsOnly.slice(3, 6);
    if (digitsOnly.length > 6) formatted += ' ' + digitsOnly.slice(6, 9);
    return formatted;
  };

  const formatPhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    let formatted = '';
    if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 2);
    if (digitsOnly.length > 2) formatted += ' ' + digitsOnly.slice(2, 5);
    if (digitsOnly.length > 5) formatted += ' ' + digitsOnly.slice(5, 7);
    if (digitsOnly.length > 7) formatted += ' ' + digitsOnly.slice(7, 9);
    return formatted;
  };

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/applications')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {application.companyName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              от {format(new Date(application.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Заявление поставщика
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actions (Mobile) */}
        <div className="lg:hidden bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Действия</h2>
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 
                       bg-primary text-white rounded-xl font-medium
                       hover:bg-primary/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              Одобрить заявку
            </button>
            <button
              onClick={() => setIsRejectModalOpen(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 
                       bg-gray-100 text-gray-700 rounded-xl font-medium
                       hover:bg-gray-200 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              Отклонить заявку
            </button>
          </div>
        </div>

        {/* Left Column */}
        <div className="space-y-8">
          {/* Company Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Информация о компании</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Название компании</div>
                  <div className="font-medium text-gray-900">{application.companyName}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">ИНН</div>
                  <div className="font-medium text-gray-900">{formatInn(application.inn)}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Категории</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {application.categories?.map((category, index) => (
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
                  <div className="text-sm text-gray-500 mb-1">Контактное лицо</div>
                  <div className="font-medium text-gray-900">{application.contactPerson}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Телефон</div>
                  <div className="font-medium text-gray-900">{formatPhoneNumber(application.contactNumber)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents (Mobile) */}
          <div className="lg:hidden bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Документы</h2>
            <div className="space-y-3">
              {application.isVatPayer && application.vatCertificateUrl && (
                <DocumentLink
                  label="Сертификат НДС"
                  url={application.vatCertificateUrl}
                />
              )}
              {application.licenseUrl && (
                <DocumentLink
                  label="Гувохнома"
                  url={application.licenseUrl}
                />
              )}
              {application.passportUrl && (
                <DocumentLink
                  label="Паспорт"
                  url={application.passportUrl}
                />
              )}
              {application.formUrl && (
                <DocumentLink
                  label="Анкета"
                  url={application.formUrl}
                />
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
                onClick={handleApprove}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                         bg-primary text-white rounded-xl font-medium
                         hover:bg-primary/90 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                Одобрить заявку
              </button>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                         bg-gray-100 text-gray-700 rounded-xl font-medium
                         hover:bg-gray-200 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                Отклонить заявку
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Документы</h2>
            <div className="space-y-3">
              {application.isVatPayer && application.vatCertificateUrl && (
                <DocumentLink
                  label="Сертификат НДС"
                  url={application.vatCertificateUrl}
                />
              )}
              {application.licenseUrl && (
                <DocumentLink
                  label="Гувохнома"
                  url={application.licenseUrl}
                />
              )}
              {application.passportUrl && (
                <DocumentLink
                  label="Паспорт"
                  url={application.passportUrl}
                />
              )}
              {application.formUrl && (
                <DocumentLink
                  label="Анкета"
                  url={application.formUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsRejectModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Отклонить заявку
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Укажите причину отклонения заявки
                  </p>
                </div>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="-mt-1 p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Причина отклонения
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full h-[120px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             text-sm text-gray-900 placeholder-gray-400
                             focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10
                             transition-colors duration-200 outline-none resize-none"
                    placeholder="Опишите причину отклонения..."
                    required
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-gray-700
                             bg-white border border-gray-200 hover:bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-primary/20
                             transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting || !rejectReason.trim()}
                    className="h-12 px-6 rounded-xl text-sm font-medium text-white
                             bg-primary hover:bg-primary/90 
                             focus:outline-none focus:ring-2 focus:ring-primary/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors"
                  >
                    {isSubmitting ? 'Отклонение...' : 'Отклонить'}
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