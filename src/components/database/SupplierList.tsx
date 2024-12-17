import { useSupplierStore } from '../../store/supplier';
import { Bell, BellOff, AlertTriangle, PackageSearch, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InfoBlockProps {
  label: string;
  value: string;
}

const InfoBlock = ({ label, value }: InfoBlockProps) => (
  <div className="bg-gray-50 rounded-2xl p-4 text-center">
    <div className="text-sm font-medium text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

interface SupplierListProps {
  searchQuery?: string;
}

export default function SupplierList({ 
  searchQuery = ''
}: SupplierListProps) {
  const navigate = useNavigate();
  const { suppliers, toggleNotifications } = useSupplierStore();

  // Search filtering
  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const name = supplier.name.toLowerCase();
    const categories = supplier.categories?.join(' ').toLowerCase() || '';
    
    return name.includes(query) || categories.includes(query);
  });

  if (filteredSuppliers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Нет поставщиков по вашему запросу' : 'Нет поставщиков'}
          </p>
        </div>
      </div>
    );
  }

  // Sort suppliers by creation date (newest first)
  const sortedSuppliers = [...filteredSuppliers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSupplierClick = (supplierId: string) => {
    navigate(`/database/${supplierId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedSuppliers.map((supplier) => (
        <div
          key={supplier.id}
          onClick={() => handleSupplierClick(supplier.id)}
          className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="relative space-y-6 transform group-hover:scale-[0.99] transition-transform">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                    {supplier.name}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
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

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoBlock
                label="Представитель"
                value={supplier.contactPerson}
              />
              <InfoBlock
                label="Участие в тендерах"
                value={`${supplier.tenderCount} ${supplier.tenderCount === 1 ? 'тендер' : 'тендеров'}`}
              />
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNotifications(supplier.id);
              }}
              className={`
                w-full rounded-2xl p-4 text-center
                text-sm font-medium
                inline-flex items-center justify-center gap-2
                transition-all
                ${supplier.notificationsEnabled 
                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-900' 
                  : 'bg-primary text-white hover:bg-primary/90'}
              `}
            >
              {supplier.notificationsEnabled ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Отключить уведомления
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Включить уведомления
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}