import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../../utils/styleConstants';

interface Event {
  id: string;
  title: string;
  date: Date;
}

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const navigate = useNavigate();

  // Get only the next 3 upcoming events
  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .slice(0, 3);

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className={`${styles.text.subheading} mb-4`}>
        БЛИЖАЙШИЕ СОБЫТИЯ
      </h3>
      <div className="space-y-2">
        {upcomingEvents.map(event => (
          <button
            key={event.id}
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
          >
            <span className="font-bold text-gray-900">{event.title}</span>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  );
}