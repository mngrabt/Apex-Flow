import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ru } from 'date-fns/locale';

interface ScheduleEventModalProps {
  event: {
    id: string;
    title: string;
    protocolId: string;
  };
  onClose: () => void;
  onSchedule: (date: Date) => Promise<void>;
}

export default function ScheduleEventModal({ event, onClose, onSchedule }: ScheduleEventModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setIsSubmitting(true);
      await onSchedule(selectedDate);
      onClose();
    } catch (error) {
      console.error('Error scheduling event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-[360px] bg-white rounded-xl shadow-lg">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    Выберите дату
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                    {event.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div className="px-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <style>{`
                  .rdp {
                    --rdp-cell-size: 38px;
                    --rdp-accent-color: rgb(var(--primary));
                    --rdp-background-color: rgb(var(--primary));
                    margin: 0;
                  }

                  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                    background-color: rgb(var(--primary) / 0.06);
                    color: rgb(var(--primary));
                  }

                  .rdp-day_selected:not([disabled]) {
                    background-color: rgb(var(--primary));
                    color: white;
                    font-weight: normal;
                  }

                  .rdp-day_selected:hover:not([disabled]) {
                    opacity: 0.9;
                  }

                  .rdp-nav_button:hover:not([disabled]) {
                    background-color: rgb(var(--primary) / 0.06);
                    color: rgb(var(--primary));
                  }
                `}</style>

                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  locale={ru}
                  className="mx-auto [&_.rdp-month]:w-full [&_.rdp-table]:w-full"
                  classNames={{
                    months: "flex flex-col space-y-3",
                    month: "space-y-3",
                    caption: "flex justify-center relative items-center h-8",
                    caption_label: "text-sm font-medium text-gray-900",
                    nav: "flex items-center gap-1",
                    nav_button: "h-7 w-7 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors inline-flex items-center justify-center",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-500 rounded-md w-[38px] font-normal text-xs",
                    row: "flex w-full mt-1",
                    cell: "relative p-0 text-center text-sm rounded-lg transition-colors focus-within:relative focus-within:z-20",
                    day: "h-[38px] w-[38px] p-0 font-normal rounded-lg transition-colors hover:bg-primary/5",
                    day_selected: "bg-primary text-white hover:bg-primary hover:text-white",
                    day_today: "bg-primary/5 text-primary font-medium",
                    day_outside: "text-gray-400 opacity-50",
                    day_disabled: "text-gray-400",
                    day_hidden: "invisible"
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 mt-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 
                           hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate}
                  className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-primary 
                           hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}