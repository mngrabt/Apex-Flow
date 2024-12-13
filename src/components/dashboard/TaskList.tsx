import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/task';

interface Task {
  id: string;
  title: string;
}

interface TaskListProps {
  title: string;
  tasks: Task[];
}

export default function TaskList({ title, tasks }: TaskListProps) {
  const navigate = useNavigate();
  const { tasks: allTasks } = useTaskStore();

  // Take only first 3 tasks for dashboard
  const dashboardTasks = allTasks.slice(0, 3);

  return (
    <div className={`relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-sm
                    ${dashboardTasks.length === 1 ? 'max-w-sm' : dashboardTasks.length === 2 ? 'max-w-sm' : 'max-w-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          {title}
        </h2>
        {allTasks.length > 3 && (
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Показать все
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {dashboardTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => navigate('/tasks')}
            className="group relative overflow-hidden bg-gray-50/80 backdrop-blur rounded-xl p-3
                     hover:bg-white hover:shadow-lg transform hover:scale-[1.02]
                     transition-all duration-300 cursor-pointer"
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                         group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                {task.name}
              </h3>
            </div>
          </div>
        ))}

        {dashboardTasks.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-xl bg-gray-50/80 backdrop-blur">
            <span className="text-xs text-gray-500 font-medium">Нет текущих задач</span>
          </div>
        )}
      </div>
    </div>
  );
}