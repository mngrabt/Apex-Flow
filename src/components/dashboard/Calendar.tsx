import { useState } from 'react';
import { useCalendarStore } from '../../store/calendar';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

export default function Calendar() {
  const { events } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Filter active events
  const activeEvents = events
    .filter(event => !event.completed)
    .map(event => ({
      id: event.id,
      title: event.title,
      date: parseISO(event.date)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // If there are no active events, don't render the calendar
  if (activeEvents.length === 0) {
    return null;
  }

  // Calculate week days
  const weekDays = ['ПОН', 'ВТО', 'СРЕ', 'ЧЕТ', 'ПЯТ'];
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dates = weekDays.map((_, i) => addDays(start, i));

  // Get selected day events (limited to 3)
  const selectedDayEvents = activeEvents
    .filter(event => isSameDay(event.date, selectedDate))
    .slice(0, 3);

  // Get closest upcoming events (limited to 3)
  const upcomingEvents = activeEvents
    .filter(event => event.date >= new Date())
    .slice(0, 3);

  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl p-6 
                    border border-white/20 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-gray-900">КАЛЕНДАРЬ</h2>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {dates.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const dayEvents = activeEvents.filter(event => isSameDay(event.date, day));
          const isToday = isSameDay(day, new Date());
          
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`relative overflow-hidden flex flex-col items-center p-3 rounded-2xl 
                       transition-all duration-300 transform hover:scale-[1.02]
                ${isSelected ? 'bg-primary shadow-lg' : 'hover:bg-gray-50/50'}
                ${isToday && !isSelected ? 'bg-gray-50/50' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 transition-colors duration-300
                ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {weekDays[i]}
              </div>
              <div className={`text-lg font-semibold transition-colors duration-300
                ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
              {dayEvents.length > 0 && (
                <div className={`mt-1 h-1.5 w-1.5 rounded-full transition-colors duration-300
                  ${isSelected ? 'bg-white' : 'bg-primary'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 mt-4">
        {selectedDayEvents.map(event => (
          <div
            key={event.id}
            className="relative overflow-hidden p-4 bg-gray-50/50 backdrop-blur rounded-2xl 
                     hover:bg-white hover:shadow-lg transform hover:scale-[1.02]
                     transition-all duration-300 cursor-pointer group"
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                         group-hover:opacity-100 transition-opacity duration-300" />

            <span className="relative font-semibold text-base text-gray-900">{event.title}</span>
          </div>
        ))}
        {selectedDayEvents.length === 0 && (
          <div className="h-20 flex items-center justify-center rounded-2xl bg-gray-50/50">
            <span className="text-sm text-gray-500">Нет событий</span>
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <>
          <div className="h-px bg-gray-200/60 my-4" />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900">БЛИЖАЙШИЕ СОБЫТИЯ</h3>
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="relative overflow-hidden p-4 bg-gray-50/50 backdrop-blur rounded-2xl 
                         hover:bg-white hover:shadow-lg transform hover:scale-[1.02]
                         transition-all duration-300 cursor-pointer group"
              >
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/20 to-transparent opacity-0 
                             group-hover:opacity-100 transition-opacity duration-300" />

                <span className="relative font-semibold text-base text-gray-900">{event.title}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}