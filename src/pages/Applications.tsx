import { useState, useEffect } from 'react';
import { useSupplierApplicationStore } from '../store/supplierApplication';
import { useOutletContext } from 'react-router-dom';
import { styles } from '../utils/styleConstants';
import ApplicationList from '../components/applications/ApplicationList';
import { ContextType } from '../types';

export default function Applications() {
  const [isLoading, setIsLoading] = useState(true);
  const { applications, fetchApplications } = useSupplierApplicationStore();
  const { searchQuery } = useOutletContext<ContextType>();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchApplications();
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchApplications]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  const filteredApplications = applications.filter(app => 
    app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())) ||
    app.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingApplications = applications.filter(app => app.status === 'pending');

  return (
    <div className={styles.padding.section}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Заявки поставщиков
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {pendingApplications.length} {pendingApplications.length === 1 ? 'заявка' : 'заявок'}
            </p>
          </div>
        </div>
      </div>

      <ApplicationList 
        applications={filteredApplications}
        searchQuery={searchQuery}
      />
    </div>
  );
}