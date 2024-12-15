import { useState, useEffect } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { useTaskStore } from '../store/task';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import { useLocation, Navigate } from 'react-router-dom';
import { styles } from '../utils/styleConstants';
import { useAuthStore } from '../store/auth';
import { hasAccess } from '../utils/accessControl';

export default function Tasks() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, fetchTasks, deleteTask } = useTaskStore();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // Check if user is Umar or Akmal
  const canCreateTask = user?.id === '00000000-0000-0000-0000-000000000007' || // Umar
                       user?.id === '00000000-0000-0000-0000-000000000008';    // Akmal

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTasks();
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchTasks]);

  useEffect(() => {
    const state = location.state as { openForm?: boolean };
    if (state?.openForm) {
      setIsFormOpen(true);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  if (!user || !hasAccess(user.id, '/tasks')) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => !t.completedAt);

  return (
    <div className={styles.padding.section}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Задачи
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeTasks.length} {activeTasks.length === 1 ? 'задача' : 'задач'}
            </p>
          </div>
        </div>
        {canCreateTask && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFormOpen(true)}
              className={styles.components.buttonPrimary}
            >
              <Plus className="h-5 w-5 mr-2" />
              Новая задача
            </button>
          </div>
        )}
      </div>

      {Array.isArray(tasks) && tasks.length > 0 ? (
        <TaskList
          tasks={tasks}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
              <ListTodo className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Нет активных задач
            </p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <TaskForm
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}