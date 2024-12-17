import { X, FileText, Download, ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/auth';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onDelete }: TaskListProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Check if user is Abdurauf
  const canCreateRequest = user?.id === '00000000-0000-0000-0000-000000000001';

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-30rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <ListTodo className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Нет задач
          </p>
        </div>
      </div>
    );
  }

  const handleCreateRequest = (task: Task) => {
    navigate('/requests', { 
      state: { 
        createRequest: true,
        taskId: task.id,
        initialData: {
          name: task.name,
          description: task.description,
          documentUrl: task.documentUrl,
          document: null,
          taskToDelete: task.id
        }
      }
    });
  };

  const handleDownload = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  return (
    <div className="grid grid-cols-3 max-[1249px]:grid-cols-1 gap-6 items-start">
      {tasks.map((task) => (
        <div 
          key={task.id}
          className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden h-fit"
        >
          <div className="relative space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-2 min-w-0 flex-1 pr-4">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                    {task.name}
                  </h3>
                  <p className="text-sm text-gray-500 break-words">{task.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  aria-label="Удалить задачу"
                  className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 
                           rounded-xl transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 max-[1249px]:grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[5rem]">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(new Date(task.createdAt), 'dd.MM.yy')}
                </div>
                <div className="text-xs text-gray-500">Создана</div>
              </div>
              {task.documentUrl ? (
                <button
                  onClick={(e) => handleDownload(task.documentUrl!, e)}
                  className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[5rem] hover:bg-primary/10 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-900 group-hover:text-primary transition-colors mb-1">
                    <Download className="w-4 h-4" />
                    Скачать
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-primary/70 transition-colors">Документация</div>
                </button>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[5rem]">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    ТЗ отсутствует
                  </div>
                  <div className="text-xs text-gray-500">Документация</div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {canCreateRequest && (
              <button
                onClick={() => handleCreateRequest(task)}
                className="w-full bg-primary text-white rounded-2xl p-4 text-center
                         hover:bg-primary/90 transition-all cursor-pointer
                         text-sm font-medium"
              >
                Создать заявку
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}