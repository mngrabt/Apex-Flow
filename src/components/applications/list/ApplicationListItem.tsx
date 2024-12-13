import { format } from 'date-fns';
import { SupplierApplication } from '../../../types';
import { styles } from '../../../utils/styleConstants';

interface ApplicationListItemProps {
  application: SupplierApplication;
  onClick: () => void;
}

export default function ApplicationListItem({ 
  application, 
  onClick 
}: ApplicationListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${styles.components.card} hover:bg-gray-50 transition-colors text-left`}
    >
      <div className="grid grid-cols-4 gap-4 items-center min-h-[64px]">
        <div className="flex items-center justify-center">
          <h3 className={styles.text.cardTitle}>{application.companyName}</h3>
        </div>
        
        <div className="flex items-center justify-center">
          <span className="px-4 py-2 bg-gray-100 rounded-2xl text-sm font-bold text-gray-900">
            {application.category}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <span className={styles.text.cardBody}>{application.contactPerson}</span>
        </div>

        <div className="flex items-center justify-center">
          <span className={styles.text.cardSubtitle}>
            {format(new Date(application.createdAt), 'dd.MM.yy')}
          </span>
        </div>
      </div>
    </button>
  );
}