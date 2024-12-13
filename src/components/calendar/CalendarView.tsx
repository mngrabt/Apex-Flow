import { useState } from 'react';
import { format, startOfMonth, endOfMonth, getDay, addDays, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useCalendarStore } from '../../store/calendar';
import { useAuthStore } from '../../store/auth';
import { useCalendarPermissions } from '../../hooks/useCalendarPermissions';
import { CalendarEvent } from '../../types';
import EditEventModal from './EditEventModal';
import { isDateToday } from '../../utils/dateUtils';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
}

export default function CalendarView({ selectedDate, onSelectDate, events }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { updateEventDate, markEventComplete } = useCalendarStore();
  const [view, setView] = useState<'month' | 'schedule'>('month');
  const user = useAuthStore(state => state.user);
  const { canManageEvents } = useCalendarPermissions();

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
      } catch (error) {
        return false;
      }
    });
  };

  const calendarDays = (() => {
    const days: Date[] = [];
    let currentDate = monthStart;
    let firstDayOfMonth = getDay(monthStart);
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(addDays(monthStart, -1 * (firstDayOfMonth - i)));
    }

    while (currentDate <= monthEnd) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(addDays(monthEnd, i));
    }

    return days;
  })();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onSelectDate(newDate);
  };

  // Get today's events for the sidebar
  const selectedDayEvents = getEventsForDay(selectedDate);

  // Get upcoming events for schedule view
  const upcomingEvents = events
    .filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return eventDate > new Date() && !isDateToday(eventDate);
      } catch (error) {
        return false;
      }
    })
    .slice(0, 3);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div>
        {/* Calendar Card */}
        <div className="bg-white rounded-xl border border-gray-100">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {format(selectedDate, 'LLLL yyyy', { locale: ru })}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {events.length} {events.length === 1 ? 'событие' : 'событий'} запланировано
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onSelectDate(new Date())}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all
                      ${!isDateToday(selectedDate) 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'hover:bg-white text-gray-600 hover:text-gray-900'}`}
                  >
                    Сегодня
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => setView('month')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                      ${view === 'month' 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-white text-gray-600 hover:text-gray-900'}`}
                  >
                    Месяц
                  </button>
                  <button
                    onClick={() => setView('schedule')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                      ${view === 'schedule' 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-white text-gray-600 hover:text-gray-900'}`}
                  >
                    Расписание
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="p-6">
            {view === 'month' ? (
              <div className="bg-gray-50/50 rounded-lg p-4">
                {/* Week day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, selectedDate);
                    const isToday = isDateToday(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={index}
                        onClick={() => onSelectDate(day)}
                        className={`
                          aspect-square p-1.5 cursor-pointer rounded-lg bg-white
                          transition-all duration-200 ease-in-out relative group
                          ${!isCurrentMonth ? 'opacity-40' : ''}
                          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center justify-center h-full">
                          <div className={`
                            flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                            ${isSelected ? 'bg-primary text-white' : ''}
                            ${isToday && !isSelected ? 'bg-primary/10 text-primary' : ''}
                            ${!isSelected && !isToday ? 'text-gray-900 group-hover:text-primary' : ''}
                          `}>
                            {format(day, 'd')}
                          </div>
                        </div>
                        
                        {hasEvents && (
                          <div className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center 
                                      bg-primary/10 text-primary text-[11px] font-medium rounded-full">
                            {dayEvents.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Today's Schedule */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Сегодня</h3>
                  <div className="bg-gray-50/50 rounded-lg divide-y divide-gray-100">
                    {selectedDayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`
                          flex items-center gap-4 p-4 cursor-pointer
                          transition-colors hover:bg-gray-100/50 first:rounded-t-lg last:rounded-b-lg
                        `}
                        onClick={() => canManageEvents ? setSelectedEvent(event) : null}
                      >
                        <div className={`
                          w-2 h-2 rounded-full shrink-0
                          ${event.completed ? 'bg-green-500' : 'bg-primary'}
                        `} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            {event.completed && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">{event.description}</p>
                          )}
                        </div>
                        {canManageEvents && !event.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markEventComplete(event.id, user?.id);
                            }}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Schedule */}
                {upcomingEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Предстоящие события</h3>
                    <div className="bg-gray-50/50 rounded-lg divide-y divide-gray-100">
                      {upcomingEvents.map(event => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-100/50 
                                   transition-colors first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {format(parseISO(event.date), 'd MMMM', { locale: ru })}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Selected Day Events */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
            </h3>
            {isDateToday(selectedDate) && (
              <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-md">
                Сегодня
              </span>
            )}
          </div>
          
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDayEvents.map(event => (
                <div
                  key={event.id}
                  className={`
                    group flex items-center gap-3 p-3 rounded-lg cursor-pointer
                    ${event.completed 
                      ? 'bg-green-50 hover:bg-green-100' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                    transition-colors
                  `}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={`
                    w-1.5 h-1.5 rounded-full
                    ${event.completed ? 'bg-green-500' : 'bg-primary'}
                  `} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {canManageEvents && !event.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markEventComplete(event.id, user?.id);
                      }}
                      className="p-2 text-gray-400 hover:text-primary rounded-lg 
                               hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Нет событий на этот день
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {canManageEvents && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdateDate={(eventId, newDate) => updateEventDate(eventId, newDate, user?.id)}
        />
      )}
    </div>
  );
}