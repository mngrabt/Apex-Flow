import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Download, ArrowLeft, CheckCircle, Plus, X, Users, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTenderStore } from '../store/tender';
import { useRequestStore } from '../store/request';
import { Tender, Supplier } from '../types';
import { Button } from '../components/shared';
import AddSupplierForm from '../components/tenders/AddSupplierForm';
import EditSupplierForm from '../components/tenders/EditSupplierForm';
import ConfirmModal from '../components/shared/ConfirmModal';
import FileUpload from '../components/shared/FileUpload';
import { supabase } from '../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { styles } from '../utils/styleConstants';

interface InfoBlockProps {
  label: string;
  value: string | number;
  isDocument?: boolean;
  documentUrl?: string;
}

const InfoBlock = ({ label, value, isDocument, documentUrl }: InfoBlockProps) => {
  if (isDocument && documentUrl) {
    return (
      <a
        href={documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors text-center"
      >
        <div className="text-sm font-medium text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </a>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center">
      <div className="text-sm font-medium text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
};

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { tenders, fetchTenders, updateSupplier, deleteSupplier } = useTenderStore();
  const { requests } = useRequestStore();
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [selectedReserveId, setSelectedReserveId] = useState<string | null>(null);
  const [winnerReason, setWinnerReason] = useState('');
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  if (!id || !user) return null;

  const tender = tenders.find(t => t.id === id);
  const request = requests.find(r => r.id === tender?.requestId);
  
  if (!tender || !request) return null;

  const canEditSupplier = (supplierId: string) => {
    if (!user) return false;
    const supplier = tender.suppliers?.find(s => s.id === supplierId);
    if (!supplier) return false;

    // Supplier can only edit their own entries
    if (user.role === 'S') {
      return supplier.createdBy === user.id;
    }

    // Abdurauf can edit suppliers he added himself, but can delete any supplier
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      // For delete button, we'll check this in the UI
      return true;
    }

    // Fozil can edit/delete/upload offers for suppliers he added himself
    if (user.id === '00000000-0000-0000-0000-000000000003') {
      return supplier.createdBy === user.id;
    }

    return false;
  };

  // Special check for Abdurauf's edit permissions
  const canEditSupplierContent = (supplierId: string) => {
    if (!user) return false;
    const supplier = tender.suppliers?.find(s => s.id === supplierId);
    if (!supplier) return false;

    // For Abdurauf, only allow editing suppliers he added himself
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      return supplier.createdBy === user.id;
    }

    // For others, use the regular canEditSupplier check
    return canEditSupplier(supplierId);
  };

  const canSelectWinner = user.id === '00000000-0000-0000-0000-000000000001';

  const handleFileUpload = async (supplierId: string, file: File) => {
    try {
      const supplier = tender.suppliers?.find(s => s.id === supplierId);
      if (!supplier || !user) return;

      // Check if user has permission to upload files for this supplier
      const canUpload = canEditSupplierContent(supplierId);

      if (!canUpload) {
        console.error('No permission to upload files for this supplier');
        return;
      }

      setIsUploading(supplierId);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `documents/${tender.id}/${supplierId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update supplier with file URL
      await updateSupplier(tender.id, supplierId, {
        proposalUrl: publicUrl
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(null);
    }
  };

  const handleFileDelete = async (supplierId: string) => {
    try {
      const supplier = tender.suppliers?.find(s => s.id === supplierId);
      if (!supplier || !user || !supplier.proposalUrl) return;

      // Check if user has permission to delete files for this supplier
      const canDelete = canEditSupplierContent(supplierId);

      if (!canDelete) {
        console.error('No permission to delete files for this supplier');
        return;
      }

      // Extract file path from URL
      const url = new URL(supplier.proposalUrl);
      const filePath = url.pathname.split('/').slice(2).join('/');

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update supplier to remove file URL
      await updateSupplier(tender.id, supplierId, {
        proposalUrl: null
      });

      setDeletingFileId(null);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleWinnerSelect = (supplierId: string) => {
    // If this supplier is already selected as winner, unselect it
    if (selectedWinnerId === supplierId) {
      setSelectedWinnerId(null);
      setSelectedReserveId(null);
      return;
    }
    
    // Select this supplier as winner
    setSelectedWinnerId(supplierId);
    setSelectedReserveId(null);
  };

  const handleReserveSelect = (supplierId: string) => {
    if (!selectedWinnerId || selectedWinnerId === supplierId) return;
    
    // If this supplier is already selected as reserve, unselect it
    if (selectedReserveId === supplierId) {
      setSelectedReserveId(null);
      setShowWinnerModal(false);
      return;
    }
    
    setSelectedReserveId(supplierId);
    setShowWinnerModal(true);
  };

  const handleWinnerConfirm = async () => {
    if (!selectedWinnerId || !winnerReason) return;

    try {
      await useTenderStore.getState().selectWinner(
        tender.id,
        selectedWinnerId,
        winnerReason,
        selectedReserveId || undefined,
        selectedReserveId ? 'Выбран как резервный победитель' : undefined
      );
      navigate('/protocols');
    } catch (error) {
      console.error('Error confirming winner:', error);
    }
  };

  const handleModalClose = () => {
    setShowWinnerModal(false);
    setWinnerReason('');
  };

  const isSupplier = user?.role === 'S';
  const hasExistingOffer = tender.suppliers?.some(s => s.createdBy === user?.id);

  // Filter suppliers based on user role
  const visibleSuppliers = isSupplier 
    ? tender.suppliers?.filter(s => s.createdBy === user?.id)
    : tender.suppliers;

  const getDaysLeft = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const totalDays = 5; // Total days for tender
    const daysPassed = differenceInDays(now, created);
    const daysLeft = Math.max(0, totalDays - daysPassed);
    return daysLeft;
  };

  const formatContractNumber = (number: string): string => {
    const digits = number.replace(/\D/g, '');
    const parts = [
      digits.slice(0, 2),    // 99
      digits.slice(2, 5),    // 825
      digits.slice(5, 7),    // 37
      digits.slice(7, 9)     // 19
    ].filter(Boolean);
    
    return parts.join(' ');
  };

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tenders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {request.items[0]?.name || `Тендер #${tender.id.slice(0, 8)}`}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              от {format(new Date(tender.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Suppliers List */}
        <div className="space-y-4 order-3 lg:order-1">
          {/* Suppliers List */}
          <div className="space-y-4">
            {visibleSuppliers?.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    Ожидаем предложений
                  </h3>
                  <p className="text-sm text-gray-500">
                    В данный тендер еще не поступило предложений
                  </p>
                </div>
              </div>
            ) : (
              visibleSuppliers?.map(supplier => (
                <div
                  key={supplier.id}
                  className={`
                    bg-white rounded-2xl p-6 shadow-sm
                    ${supplier.id === selectedWinnerId ? 'border border-primary/20 bg-primary/5' :
                      supplier.id === selectedReserveId ? 'border border-primary/50 bg-primary/5' :
                      'border border-gray-100'}
                    transition-all duration-200
                  `}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {supplier.companyName}
                        </h3>
                        {supplier.id === tender.winnerId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-2">
                            Победитель
                          </span>
                        )}
                        {supplier.id === tender.reserveWinnerId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary/80 mt-2">
                            Резервный победитель
                          </span>
                        )}
                      </div>

                      {/* Edit and Delete buttons */}
                      {canEditSupplier(supplier.id) && (
                        <div className="flex items-center gap-2">
                          {canEditSupplierContent(supplier.id) && (
                            <button
                              onClick={() => setEditingSupplierId(supplier.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center
                                       text-gray-400 hover:text-primary hover:bg-gray-50
                                       transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingSupplierId(supplier.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                                     text-gray-400 hover:text-red-500 hover:bg-gray-50
                                     transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Представитель</div>
                        <div className="font-medium text-gray-900">{supplier.contactPerson}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Телефон</div>
                        <div className="font-medium text-gray-900">{formatContractNumber(supplier.contactNumber)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                        <div className="font-medium text-gray-900">{supplier.deliveryTime} дней</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">НДС включен</div>
                        <div className="font-medium text-gray-900">{supplier.includeTax ? 'Да' : 'Нет'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Цена за единицу</div>
                        <div className="font-medium text-gray-900">{Number(supplier.pricePerUnit).toLocaleString('ru-RU')} сум</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Общая сумма</div>
                        <div className="font-medium text-gray-900">{Number(supplier.price).toLocaleString('ru-RU')} сум</div>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    {supplier.proposalUrl ? (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <a
                            href={supplier.proposalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Предложение участника
                          </a>
                          {canEditSupplierContent(supplier.id) && (
                            <button
                              onClick={() => setDeletingFileId(supplier.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center
                                     text-gray-400 hover:text-gray-600 hover:bg-gray-50
                                     transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : canEditSupplierContent(supplier.id) ? (
                      <div className="pt-4 border-t border-gray-100">
                        <FileUpload
                          onUpload={(file) => handleFileUpload(supplier.id, file)}
                          isUploading={isUploading === supplier.id}
                        />
                      </div>
                    ) : null}

                    {canSelectWinner && tender.status === 'active' && supplier.proposalUrl && (
                      <button
                        onClick={() => {
                          if (selectedWinnerId === supplier.id) {
                            setSelectedWinnerId(null);
                            setSelectedReserveId(null);
                            setShowWinnerModal(false);
                            return;
                          }
                          
                          if (selectedReserveId === supplier.id) {
                            setSelectedReserveId(null);
                            setShowWinnerModal(false);
                            return;
                          }
                          
                          if (selectedWinnerId && selectedWinnerId !== supplier.id) {
                            setSelectedReserveId(supplier.id);
                            setShowWinnerModal(true);
                            return;
                          }
                          
                          setSelectedWinnerId(supplier.id);
                          setSelectedReserveId(null);
                          if (tender.suppliers?.length === 1) {
                            setShowWinnerModal(true);
                          }
                        }}
                        className={`
                          w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                          text-sm font-medium transition-all
                          ${selectedWinnerId === supplier.id
                            ? 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
                            : selectedWinnerId && selectedReserveId === supplier.id
                              ? 'bg-primary/50 text-white hover:bg-primary/40'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }
                        `}
                      >
                        {selectedWinnerId === supplier.id
                          ? 'Отменить назначение'
                          : selectedWinnerId && selectedReserveId === supplier.id
                            ? 'Отменить назначение'
                            : selectedWinnerId
                              ? 'Назначить резервным'
                              : 'Назначить победителем'
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Info Blocks */}
        <div className="space-y-4 lg:order-2">
          {/* Tender Details - Desktop */}
          <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Детали тендера</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Поставщики</div>
                <div className="font-medium text-gray-900">
                  {tender.suppliers?.length || 0} из 10
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(tender.createdAt), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Осталось дней</div>
                <div className={`font-medium ${getDaysLeft(tender.createdAt) === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {getDaysLeft(tender.createdAt)} {getDaysLeft(tender.createdAt) === 1 ? 'день' : getDaysLeft(tender.createdAt) >= 2 && getDaysLeft(tender.createdAt) <= 4 ? 'дня' : 'дней'}
                </div>
              </div>
            </div>

            {/* Add Supplier/Offer Button */}
            {(!isSupplier || !hasExistingOffer) && (tender.suppliers || []).length < 10 && (
              <button
                onClick={() => setIsAddingSupplier(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl mt-6
                         text-sm font-medium transition-all
                         bg-primary text-white hover:bg-primary/90 active:bg-primary/80"
              >
                <UserPlus className="w-4 h-4" />
                {isSupplier ? 'Добавить предложение' : 'Добавить поставщика'}
              </button>
            )}
          </div>

          {/* Request Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm order-1 lg:order-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Параметры заявки</h2>
              {request.documentUrl && (
                <a
                  href={request.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Скачать ТЗ
                </a>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Название</div>
                    <div className="font-medium text-gray-900">
                      {request.items[0]?.name}
                    </div>
                  </div>
                  {request.items[0]?.description && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Описание</div>
                      <div className="font-medium text-gray-900">
                        {request.items[0]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Количество</div>
                  <div className="font-medium text-gray-900">
                    {request.items[0]?.quantity} {request.items[0]?.unitType}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Срок поставки</div>
                  <div className="font-medium text-gray-900">
                    {request.items[0]?.deadline} дней
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Тип объекта</div>
                  <div className="font-medium text-gray-900">
                    {request.items[0]?.objectType === 'office' ? 'Офис' : 'Стройка'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(request.createdAt), 'd MMMM yyyy', { locale: ru })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tender Details - Mobile */}
        <div className="lg:hidden order-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Детали тендера</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Поставщики</div>
                <div className="font-medium text-gray-900">
                  {tender.suppliers?.length || 0} из 10
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(tender.createdAt), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Осталось дней</div>
                <div className={`font-medium ${getDaysLeft(tender.createdAt) === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                  {getDaysLeft(tender.createdAt)} {getDaysLeft(tender.createdAt) === 1 ? 'день' : getDaysLeft(tender.createdAt) >= 2 && getDaysLeft(tender.createdAt) <= 4 ? 'дня' : 'дней'}
                </div>
              </div>
            </div>

            {/* Add Supplier/Offer Button */}
            {(!isSupplier || !hasExistingOffer) && (tender.suppliers || []).length < 10 && (
              <button
                onClick={() => setIsAddingSupplier(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl mt-6
                         text-sm font-medium transition-all
                         bg-primary text-white hover:bg-primary/90 active:bg-primary/80"
              >
                <UserPlus className="w-4 h-4" />
                {isSupplier ? 'Добавить предложение' : 'Добавить поставщика'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddingSupplier && (
        <AddSupplierForm
          tenderId={tender.id}
          onClose={() => setIsAddingSupplier(false)}
          currentUser={user}
        />
      )}

      {editingSupplierId && (
        <EditSupplierForm
          tenderId={tender.id}
          supplierId={editingSupplierId}
          onClose={() => setEditingSupplierId(null)}
        />
      )}

      {deletingSupplierId && (
        <ConfirmModal
          title="Удаление поставщика"
          message="Вы уверены, что хотите удалить этого поставщика? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={async () => {
            await deleteSupplier(tender.id, deletingSupplierId);
            setDeletingSupplierId(null);
          }}
          onClose={() => setDeletingSupplierId(null)}
          onCancel={() => setDeletingSupplierId(null)}
          isDestructive
        />
      )}

      {deletingFileId && (
        <ConfirmModal
          title="Удаление предложения"
          message="Вы действительно хотите удалить предложение участника?"
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={() => handleFileDelete(deletingFileId)}
          onClose={() => setDeletingFileId(null)}
          onCancel={() => setDeletingFileId(null)}
          isDestructive={false}
        />
      )}

      {showWinnerModal && selectedWinnerId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={handleModalClose}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedReserveId ? 'Назначение победителей тендера' : 'Назначение победителя тендера'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedReserveId ? 'Обоснования выбора победителей' : 'Обоснование выбора победителя'}
                  </p>
                </div>
                <button
                  onClick={handleModalClose}
                  className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Selected Winners */}
                <div className="space-y-4">
                  {/* Winner */}
                  {selectedWinnerId && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            Победитель
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                            {tender.suppliers?.find(s => s.id === selectedWinnerId)?.companyName}
                          </span>
                        </div>
                      </div>
                      <div>
                        <textarea
                          value={winnerReason}
                          onChange={(e) => setWinnerReason(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 
                                   placeholder:text-gray-400 resize-none
                                   focus:border-primary focus:ring-2 focus:ring-primary/10 
                                   transition-colors duration-200 outline-none"
                          rows={3}
                          placeholder="Укажите обоснование выбора основного победителя..."
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Reserve Winner */}
                  {selectedReserveId && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            Резервный победитель
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                            {tender.suppliers?.find(s => s.id === selectedReserveId)?.companyName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100">
                <button
                  onClick={handleModalClose}
                  className="h-11 px-6 rounded-xl text-sm font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleWinnerConfirm}
                  disabled={!winnerReason.trim()}
                  className="h-11 px-6 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Утвердить выбор
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}