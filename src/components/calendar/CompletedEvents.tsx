import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, Clock, RotateCcw, ArrowUpRight } from 'lucide-react';
import { useCalendarStore } from '../../store/calendar';
import { useAuthStore } from '../../store/auth';
import { useCalendarPermissions } from '../../hooks/useCalendarPermissions';

interface CompletedEvent {
  id: string;
  title: string;
  date: string;
}

interface CompletedEventsProps {
  events: CompletedEvent[];
}

export default function CompletedEvents({ events }: CompletedEventsProps) {
  const { undoEventComplete } = useCalendarStore();
  const user = useAuthStore(state => state.user);
  const { canManageEvents } = useCalendarPermissions();
  
  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Завершенные объемы
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {events.length} {events.length === 1 ? 'объем' : 'объемов'} выполнено
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-sm 
                     font-medium rounded-lg hover:bg-green-100 transition-colors"
          >
            <span>Архив</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {events.map(event => {
          const date = parseISO(event.date);
          return (
            <div
              key={event.id}
              className="group flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {format(date, 'd MMMM', { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>
              {canManageEvents && (
                <button
                  onClick={() => undoEventComplete(event.id, user?.id)}
                  className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100
                           opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Вернуть в календарь"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}