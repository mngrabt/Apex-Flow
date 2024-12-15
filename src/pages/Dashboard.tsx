import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, getFirstName } from '../store/auth';
import { useRequestStore } from '../store/request';
import { useProtocolStore } from '../store/protocol';
import { useTenderStore } from '../store/tender';
import { useArchiveStore } from '../store/archive';
import { useTaskStore } from '../store/task';
import { useSupplierStore } from '../store/supplier';
import { useApplicationStore, Application } from '../store/application';
import { Clock, ArrowUpRight, ScrollText, FileText, ListTodo, ChevronRight, Calendar as CalendarIcon, AlertCircle, Building2, Plus } from 'lucide-react';
import { hasBlockAccess } from '../utils/accessControl';
import { format, startOfToday, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isSameMonth, differenceInDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Protocol, Task, Tender } from '../types';
import { useCalendarStore } from '../store/calendar';
import { styles } from '../utils/styleConstants';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { requests, fetchRequests } = useRequestStore();
  const { protocols, fetchProtocols } = useProtocolStore();
  const { tenders, fetchTenders } = useTenderStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [isLoading, setIsLoading] = useState(true);
  const { events } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { applications, fetchApplications } = useApplicationStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchRequests(),
          fetchProtocols(),
          fetchTenders(),
          fetchTasks(),
          fetchSuppliers(),
          fetchApplications()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchRequests, fetchProtocols, fetchTenders, fetchTasks, fetchSuppliers, fetchApplications]);

  if (!user) return null;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check for specific users
  const isAziz = user.id === '00000000-0000-0000-0000-000000000004';
  const isFozil = user.id === '00000000-0000-0000-0000-000000000003';
  const isUmarali = user.id === '00000000-0000-0000-0000-000000000005';
  const isUmar = user.id === '00000000-0000-0000-0000-000000000007';
  const isAkmal = user.id === '00000000-0000-0000-0000-000000000008';
  
  // Should hide right column if any of these users (except Umar and Akmal who keep calendar and quick actions)
  const shouldHideRightColumn = isAziz || isFozil || isUmarali;
  const showOnlyCalendarAndActions = isUmar || isAkmal;

  // Get pending items that need attention
  const pendingRequests = requests?.filter(r => !r.signatures?.some(s => s.userId === user.id)) || [];
  const pendingProtocols = protocols?.filter(p => 
    p.type !== 'cash' && // Exclude cash requests
    !p.signatures?.some(s => s.userId === user.id)
  ) || [];
  const activeTenders = tenders?.filter(t => t.status === 'active') || [];
  const pendingTasks = tasks?.filter(t => !t.completedAt) || [];

  // Get delayed payment protocols
  const delayedProtocols = protocols?.filter(protocol => {
    if (protocol.financeStatus !== 'waiting' || !protocol.submittedAt) return false;
    const waitingDays = differenceInDays(new Date(), new Date(protocol.submittedAt));
    return waitingDays > 5;
  }) || [];

  // Calculate completion rates
  const totalRequests = requests?.length || 0;
  const completedRequests = totalRequests - pendingRequests.length;
  const requestsRate = totalRequests ? Math.round((completedRequests / totalRequests) * 100) : 0;

  const totalProtocols = protocols?.length || 0;
  const completedProtocols = totalProtocols - pendingProtocols.length;
  const protocolsRate = totalProtocols ? Math.round((completedProtocols / totalProtocols) * 100) : 0;

  const totalTasks = tasks?.length || 0;
  const completedTasks = totalTasks - pendingTasks.length;
  const tasksRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Check if user has access to tasks
  const hasTaskAccess = hasBlockAccess(user.id, 'tasks');

  // Get events for selected date
  const selectedDateEvents = selectedDate 
    ? events?.filter(event => isSameDay(new Date(event.date), selectedDate))
          .slice(0, 3) 
    : [];

  return (
    <div className={styles.padding.section}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            С возвращением, {getFirstName(user.name)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {format(new Date(), 'HH:mm')}
            </div>
            <div className="text-xs text-gray-500">
              Местное время
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Stats and Activity */}
        <div className={`col-span-12 ${shouldHideRightColumn && !showOnlyCalendarAndActions ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {/* Stats Grid */}
          <div className={`grid grid-cols-1 ${hasTaskAccess ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {/* Requests Progress - Hide for Umarali, Umar, and Akmal */}
            {!isUmarali && !isUmar && !isAkmal && (
              <button
                onClick={() => navigate('/requests')}
                className="text-left w-full h-full"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all h-full">
                  {pendingRequests.length > 0 && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Заявки</div>
                      <div className="mt-1 text-2xl font-semibold">{requestsRate}%</div>
                      {pendingRequests.length > 0 && (
                        <div className="mt-1 text-xs font-medium text-primary">
                          {pendingRequests.length} ожидает подпись
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${requestsRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Выполнено</span>
                    <span className="font-medium text-gray-900">{completedRequests} из {totalRequests}</span>
                  </div>
                </div>
              </button>
            )}

            {/* For Umarali, show Protocols and Finance Delays in a row */}
            {isUmarali ? (
              <div className="grid grid-cols-2 gap-6 col-span-full">
                {/* Protocols Progress */}
                <button onClick={() => navigate('/protocols')} className="text-left w-full h-full">
                  <div className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all h-full">
                    {pendingProtocols.length > 0 && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Протоколы</div>
                        <div className="mt-1 text-2xl font-semibold">{protocolsRate}%</div>
                        {pendingProtocols.length > 0 && (
                          <div className="mt-1 text-xs font-medium text-primary">
                            {pendingProtocols.length} ожидает подпись
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ScrollText className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${protocolsRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Выполнено</span>
                      <span className="font-medium text-gray-900">{completedProtocols} из {totalProtocols}</span>
                    </div>
                  </div>
                </button>

                {/* Finance Delays */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">Задержки оплат</h2>
                      <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {delayedProtocols.length}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/finances')}
                      className="text-xs font-medium text-primary hover:text-primary/80 
                               transition-colors flex items-center gap-1"
                    >
                      Все платежи
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {delayedProtocols.slice(0, 3).map(protocol => {
                      const waitingDays = differenceInDays(new Date(), new Date(protocol.submittedAt!));
                      return (
                        <div
                          key={protocol.id}
                          onClick={() => protocol.type === 'cash' ? navigate(`/cash-requests/${protocol.id}`) : navigate(`/protocols/${protocol.id}`)}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 
                                   cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {protocol.type === 'tender' 
                                ? protocol.tender?.request?.items[0]?.name
                                : protocol.request?.items[0]?.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Ожидает {waitingDays} {waitingDays === 1 ? 'день' : 'дней'}
                            </div>
                          </div>
                          <div className={`
                            px-2 py-1 rounded-full text-[10px] font-medium
                            ${protocol.urgency === 'high' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-primary/10 text-primary'}
                          `}>
                            {protocol.urgency === 'high' ? 'Срочно' : 'Не срочно'}
                          </div>
                        </div>
                      );
                    })}
                    {delayedProtocols.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        Нет задержек по оплате
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Regular protocols display for other users
              <>
                {!isUmar && !isAkmal && (
                  <button
                    onClick={() => navigate('/protocols')}
                    className="text-left w-full h-full"
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all h-full">
                      {pendingProtocols.length > 0 && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Протоколы</div>
                          <div className="mt-1 text-2xl font-semibold">{protocolsRate}%</div>
                          {pendingProtocols.length > 0 && (
                            <div className="mt-1 text-xs font-medium text-primary">
                              {pendingProtocols.length} ожидает подпись
                            </div>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ScrollText className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${protocolsRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Выполнено</span>
                        <span className="font-medium text-gray-900">{completedProtocols} из {totalProtocols}</span>
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}

            {/* Tasks Progress - Only show if user has access */}
            {hasTaskAccess && (
              <button
                onClick={() => navigate('/tasks')}
                className="text-left w-full h-full"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all h-full">
                  {pendingTasks.length > 0 && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Задачи</div>
                      <div className="mt-1 text-2xl font-semibold">{tasksRate}%</div>
                      {pendingTasks.length > 0 && (
                        <div className="mt-1 text-xs font-medium text-primary">
                          {pendingTasks.length} активных
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ListTodo className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${tasksRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Выполнено</span>
                    <span className="font-medium text-gray-900">{completedTasks} из {totalTasks}</span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Active Tenders - Hide for Aziz, Umarali, Umar, and Akmal */}
          {!isAziz && !isUmarali && !isUmar && !isAkmal && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Активные тендеры</h3>
                  <button
                    onClick={() => navigate('/tenders')}
                    className="text-primary hover:text-primary/80 transition-colors text-sm font-medium inline-flex items-center gap-1"
                  >
                    Все тендеры
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {activeTenders?.slice(0, 3).map(tender => {
                    const request = requests?.find(r => r.id === tender.requestId);
                    const firstItem = request?.items?.[0];
                    
                    return (
                      <div
                        key={tender.id}
                        onClick={() => navigate(`/tenders/${tender.id}`)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                                cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {firstItem?.name || 'Без названия'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {request?.date ? format(new Date(request.date), 'd MMMM yyyy', { locale: ru }) : 'Дата не указана'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })}
                  {(!activeTenders || activeTenders.length === 0) && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      Нет активных тендеров
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions for Mobile */}
              <div className="lg:hidden bg-primary rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Быстрые действия</h3>
                <div className={`${user.id === '00000000-0000-0000-0000-000000000001' ? '' : 'grid grid-cols-2'} gap-3`}>
                  <button
                    onClick={() => navigate('/requests', { state: { openForm: true } })}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl 
                              bg-white/10 hover:bg-white/20 transition-colors text-center w-full"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Новая заявка</span>
                  </button>
                  {hasTaskAccess && (user.id === '00000000-0000-0000-0000-000000000007' || user.id === '00000000-0000-0000-0000-000000000008') && (
                    <button
                      onClick={() => navigate('/tasks', { state: { openForm: true } })}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl 
                                bg-white/10 hover:bg-white/20 transition-colors text-center"
                    >
                      <ListTodo className="w-5 h-5" />
                      <span className="text-sm font-medium">Новая задача</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Calendar for Mobile */}
              <div className="lg:hidden bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Календарь</h3>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="text-primary hover:text-primary/80 transition-colors text-sm font-medium inline-flex items-center gap-1"
                  >
                    Открыть календарь
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(), 'LLLL yyyy', { locale: ru })}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-[11px] font-medium text-gray-500 text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {eachDayOfInterval({
                    start: startOfWeek(startOfToday(), { weekStartsOn: 1 }),
                    end: endOfWeek(startOfToday(), { weekStartsOn: 1 })
                  }).map(day => {
                    const isCurrentMonth = isSameMonth(day, startOfToday());
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const dayEvents = events?.filter(event => isSameDay(new Date(event.date), day)) || [];
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={day.toString()}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={`
                          relative aspect-square flex items-center justify-center rounded-lg text-sm
                          cursor-pointer transition-all duration-200
                          ${isToday(day) 
                            ? 'bg-primary text-white font-medium' 
                            : isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : isCurrentMonth
                                ? 'text-gray-900 hover:bg-gray-50'
                                : 'text-gray-300'
                          }
                        `}
                      >
                        {format(day, 'd')}
                        {hasEvents && !isToday(day) && !isSelected && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Events for selected date */}
                {selectedDate && selectedDateEvents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-gray-500">
                      События на {format(selectedDate, 'd MMMM', { locale: ru })}:
                    </div>
                    {selectedDateEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 
                                 transition-colors cursor-pointer"
                        onClick={() => navigate('/calendar')}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {event.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tasks and Payments Row */}
          <div className={`grid ${hasTaskAccess ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* Delayed Payments - Show for users except Aziz, Fozil, Umar, Akmal, and Umarali (since Umarali has it in special row) */}
            {!isAziz && !isFozil && !isUmar && !isAkmal && !isUmarali && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Задержки оплат</h2>
                    <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {delayedProtocols.length}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/finances')}
                    className="text-xs font-medium text-primary hover:text-primary/80 
                             transition-colors flex items-center gap-1"
                  >
                    Все платежи
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {delayedProtocols.slice(0, 3).map(protocol => {
                    const waitingDays = differenceInDays(new Date(), new Date(protocol.submittedAt!));
                    return (
                      <div
                        key={protocol.id}
                        onClick={() => protocol.type === 'cash' ? navigate(`/cash-requests/${protocol.id}`) : navigate(`/protocols/${protocol.id}`)}
                        className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 
                                 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {protocol.type === 'tender' 
                              ? protocol.tender?.request?.items[0]?.name
                              : protocol.request?.items[0]?.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Ожидает {waitingDays} {waitingDays === 1 ? 'день' : 'дней'}
                          </div>
                        </div>
                        <div className={`
                          px-2 py-1 rounded-full text-[10px] font-medium
                          ${protocol.urgency === 'high' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-primary/10 text-primary'}
                        `}>
                          {protocol.urgency === 'high' ? 'Срочно' : 'Не срочно'}
                        </div>
                      </div>
                    );
                  })}
                  {delayedProtocols.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      Нет задержек по оплате
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Tasks - Only show if user has access */}
            {hasTaskAccess && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Текущие задачи</h2>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="text-xs font-medium text-primary hover:text-primary/80 
                             transition-colors flex items-center gap-1"
                  >
                    Все задачи
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  {pendingTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                               cursor-pointer transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {task.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(task.createdAt), 'd MMMM yyyy', { locale: ru })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      Нет текущих задач
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Applications - Mobile Version */}
          {!isAziz && !isFozil && !isUmarali && !isUmar && !isAkmal && (
            <div className="lg:hidden bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Новые заявления</h3>
                <button
                  onClick={() => navigate('/applications')}
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium inline-flex items-center gap-1"
                >
                  Все заявки
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {applications?.filter(app => app.status === 'pending')
                  .slice(0, 3)
                  .map((application: Application) => (
                  <div
                    key={application.id}
                    onClick={() => navigate(`/applications/${application.id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                              cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {application.companyName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(application.createdAt), 'dd.MM.yy', { locale: ru })}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                {(!applications || applications.filter(app => app.status === 'pending').length === 0) && (
                  <div className="text-center py-8 text-sm text-gray-500">
                    Нет новых заявок
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Database - Mobile Version */}
          {!isAziz && !isFozil && !isUmarali && !isUmar && !isAkmal && (
            <div className="lg:hidden bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">База подрядчиков</h2>
                <button
                  onClick={() => navigate('/database')}
                  className="text-xs font-medium text-primary hover:text-primary/80 
                           transition-colors flex items-center gap-1"
                >
                  Открыть базу
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {suppliers?.slice(0, 3).map(supplier => (
                  <div
                    key={supplier.id}
                    onClick={() => navigate(`/database/${supplier.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 
                             cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {supplier.companyName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {supplier.contactPerson || 'Нет контактного лица'}
                      </div>
                    </div>
                  </div>
                ))}
                {(!suppliers || suppliers.length === 0) && (
                  <div className="text-center py-8 text-sm text-gray-500">
                    База пуста
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        {(!shouldHideRightColumn || showOnlyCalendarAndActions) && (
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Calendar - Desktop Only */}
            <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Календарь</h3>
                <button
                  onClick={() => navigate('/calendar')}
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium inline-flex items-center gap-1"
                >
                  Открыть календарь
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center mb-4">
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(), 'LLLL yyyy', { locale: ru })}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className="text-[11px] font-medium text-gray-500 text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({
                  start: startOfWeek(startOfToday(), { weekStartsOn: 1 }),
                  end: endOfWeek(startOfToday(), { weekStartsOn: 1 })
                }).map(day => {
                  const isCurrentMonth = isSameMonth(day, startOfToday());
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const dayEvents = events?.filter(event => isSameDay(new Date(event.date), day)) || [];
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`
                        relative aspect-square flex items-center justify-center rounded-lg text-sm
                        cursor-pointer transition-all duration-200
                        ${isToday(day) 
                          ? 'bg-primary text-white font-medium' 
                          : isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : isCurrentMonth
                              ? 'text-gray-900 hover:bg-gray-50'
                              : 'text-gray-300'
                        }
                      `}
                    >
                      {format(day, 'd')}
                      {hasEvents && !isToday(day) && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Events for selected date */}
              {selectedDate && selectedDateEvents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-medium text-gray-500">
                    События на {format(selectedDate, 'd MMMM', { locale: ru })}:
                  </div>
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 
                               transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar')}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {event.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions - Desktop Only */}
            <div className="hidden lg:block bg-primary rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Быстрые действия</h3>
              <div className={`${user.id === '00000000-0000-0000-0000-000000000001' ? '' : 'grid grid-cols-2'} gap-3`}>
                <button
                  onClick={() => navigate('/requests', { state: { openForm: true } })}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl 
                            bg-white/10 hover:bg-white/20 transition-colors text-center w-full"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Новая заявка</span>
                </button>
                {hasTaskAccess && (user.id === '00000000-0000-0000-0000-000000000007' || user.id === '00000000-0000-0000-0000-000000000008') && (
                  <button
                    onClick={() => navigate('/tasks', { state: { openForm: true } })}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl 
                              bg-white/10 hover:bg-white/20 transition-colors text-center"
                  >
                    <ListTodo className="w-5 h-5" />
                    <span className="text-sm font-medium">Новая задача</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Applications - Desktop Version */}
            {!isAziz && !isFozil && !isUmarali && !isUmar && !isAkmal && (
              <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Новые заявления</h3>
                  <button
                    onClick={() => navigate('/applications')}
                    className="text-primary hover:text-primary/80 transition-colors text-sm font-medium inline-flex items-center gap-1"
                  >
                    Все заявки
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {applications?.filter(app => app.status === 'pending')
                    .slice(0, 3)
                    .map((application: Application) => (
                    <div
                      key={application.id}
                      onClick={() => navigate(`/applications/${application.id}`)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 
                                cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {application.companyName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(application.createdAt), 'dd.MM.yy', { locale: ru })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                  {(!applications || applications.filter(app => app.status === 'pending').length === 0) && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      Нет новых заявок
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Database Entries - Desktop Version */}
            {!isAziz && !isFozil && !isUmarali && !isUmar && !isAkmal && (
              <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">База подрядчиков</h2>
                  <button
                    onClick={() => navigate('/database')}
                    className="text-xs font-medium text-primary hover:text-primary/80 
                             transition-colors flex items-center gap-1"
                  >
                    Открыть базу
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {suppliers?.slice(0, 3).map(supplier => (
                    <div
                      key={supplier.id}
                      onClick={() => navigate(`/database/${supplier.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 
                               cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {supplier.companyName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {supplier.contactPerson || 'Нет контактного лица'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!suppliers || suppliers.length === 0) && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      База пуста
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}