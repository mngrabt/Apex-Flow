import { useState, useEffect } from 'react';
import { useRequestStore } from '../store/request';
import { useTaskStore } from '../store/task';
import { useAuthStore } from '../store/auth';
import { useLocation } from 'react-router-dom';
import RequestForm from '../components/requests/RequestForm';
import RequestList from '../components/requests/RequestList';
import RequestHeader from '../components/requests/RequestHeader';
import PermissionLimited from '../components/shared/PermissionLimited';
import { styles } from '../utils/styleConstants';

export default function Requests() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<{
    name: string;
    description: string;
    documentUrl?: string;
    taskId?: string;
  } | null>(null);
  
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { requests, subscribeToSignatures } = useRequestStore();
  const { deleteTask } = useTaskStore();

  useEffect(() => {
    // Subscribe to signature changes
    const unsubscribe = subscribeToSignatures();
    return () => unsubscribe();
  }, [subscribeToSignatures]);

  useEffect(() => {
    // Check if we have initial data from task or openForm state
    const state = location.state as { 
      createRequest?: boolean;
      openForm?: boolean;
      taskId?: string;
      initialData?: {
        name: string;
        description: string;
        documentUrl?: string;
      };
    };

    if ((state?.createRequest && state.initialData) || state?.openForm) {
      setInitialFormData(state?.initialData || null);
      setIsFormOpen(true);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleFormClose = async (saved: boolean) => {
    if (saved && initialFormData?.taskId) {
      // Only delete the task if the request was successfully created
      try {
        await deleteTask(initialFormData.taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    setIsFormOpen(false);
    setInitialFormData(null);
  };

  // Check for supplier role
  if (user?.role === 'S') {
    return (
      <PermissionLimited 
        title="Раздел недоступен"
        message="Этот раздел доступен только для сотрудников компании. Поставщики могут видеть только тендеры, в которых они участвуют."
      />
    );
  }

  const canCreateRequest = user?.role === 'A';

  return (
    <div className={`${styles.padding.section}`}>
      <RequestHeader
        onCreateRequest={() => setIsFormOpen(true)}
        canCreateRequest={canCreateRequest}
      />

      <RequestList requests={requests} />

      {isFormOpen && (
        <RequestForm 
          onClose={handleFormClose}
          initialData={initialFormData}
        />
      )}
    </div>
  );
}