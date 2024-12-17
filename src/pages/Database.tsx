import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSupplierStore } from '../store/supplier';
import SupplierList from '../components/database/SupplierList';
import AddSupplierModal from '../components/database/AddSupplierModal';
import { styles } from '../utils/styleConstants';

interface ContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Database() {
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { searchQuery } = useOutletContext<ContextType>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return (
    <div className={styles.padding.section}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            База поставщиков
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {suppliers.length}{' '}
            {(() => {
              const count = suppliers.length;
              const lastDigit = count % 10;
              const lastTwoDigits = count % 100;

              if (count === 0) return 'поставщиков';
              if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'поставщиков';
              if (lastDigit === 1) return 'поставщик';
              if (lastDigit >= 2 && lastDigit <= 4) return 'поставщика';
              return 'поставщиков';
            })()}
          </p>
        </div>
      </div>

      <SupplierList
        searchQuery={searchQuery}
      />

      {isAddModalOpen && (
        <AddSupplierModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}