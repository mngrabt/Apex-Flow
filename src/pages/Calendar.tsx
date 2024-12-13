import { useState, useEffect } from 'react';
import { useCalendarStore } from '../store/calendar';
import CalendarView from '../components/calendar/CalendarView';
import UnscheduledEvents from '../components/calendar/UnscheduledEvents';
import CompletedEvents from '../components/calendar/CompletedEvents';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { styles } from '../utils/styleConstants';

export default function Calendar() {
  const { events, unscheduledEvents, fetchEvents } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Split events into active and completed
  const activeEvents = events.filter(event => !event.completed);
  const completedEvents = events.filter(event => event.completed);

  return (
    <div className={styles.padding.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Календарь
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {events.length} {events.length === 1 ? 'событие' : 'событий'}
            </p>
          </div>
        </div>
      </div>

      {/* Only show unscheduled events if there are any */}
      {unscheduledEvents.length > 0 && (
        <UnscheduledEvents events={unscheduledEvents} />
      )}

      {/* Calendar Grid */}
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={activeEvents}
      />

      {/* Completed Events */}
      <CompletedEvents events={completedEvents} />
    </div>
  );
}