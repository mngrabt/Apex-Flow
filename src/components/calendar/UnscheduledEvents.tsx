import { useState } from 'react';
import { useCalendarStore } from '../../store/calendar';
import { useAuthStore } from '../../store/auth';
import { useCalendarPermissions } from '../../hooks/useCalendarPermissions';
import ScheduleEventModal from './ScheduleEventModal';
import { Calendar, ArrowRight } from 'lucide-react';

interface UnscheduledEvent {
  id: string;
  title: string;
  protocolId: string;
}

interface UnscheduledEventsProps {
  events: UnscheduledEvent[];
}

export default function UnscheduledEvents({ events }: UnscheduledEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<UnscheduledEvent | null>(null);
  const { scheduleEvent } = useCalendarStore();
  const user = useAuthStore(state => state.user);
  const { canManageEvents } = useCalendarPermissions();

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Неопределенные объемы
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {events.length} {events.length === 1 ? 'объем' : 'объемов'} ожидает
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 pb-1">
        {events.map(event => (
          <div
            key={event.id}
            className={`
              group flex items-center justify-between px-6 py-4 hover:bg-gray-50 
              transition-colors ${canManageEvents ? 'cursor-pointer' : ''}
            `}
            onClick={() => canManageEvents ? setSelectedEvent(event) : null}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {event.title}
              </h3>
            </div>
            {canManageEvents && (
              <div className="flex items-center gap-2 text-primary">
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Определить
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {canManageEvents && selectedEvent && (
        <ScheduleEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSchedule={(date) => scheduleEvent(selectedEvent.protocolId, date, user?.id)}
        />
      )}
    </div>
  );
}