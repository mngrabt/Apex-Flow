import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { styles } from '../../utils/styleConstants';
import { SupplierApplication } from '../../types';
import { ClipboardSignature } from 'lucide-react';

interface ApplicationListProps {
  applications: SupplierApplication[];
  searchQuery: string;
}

export default function ApplicationList({ applications, searchQuery }: ApplicationListProps) {
  const navigate = useNavigate();
  const pendingApplications = applications
    .filter(app => app.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (pendingApplications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
            <ClipboardSignature className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Нет активных заявлений
          </p>
        </div>
      </div>
    );
  }

  const handleApplicationClick = (applicationId: string) => {
    console.log('Navigating to application:', applicationId);
    navigate(`/applications/${applicationId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pendingApplications.map((application) => (
        <div
          key={application.id}
          onClick={() => handleApplicationClick(application.id)}
          className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="relative space-y-6 transform group-hover:scale-[0.99] transition-transform">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight line-clamp-1">
                    {application.companyName}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {application.categories?.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 max-[1249px]:grid-cols-1 gap-4">
              {/* Contact Person */}
              <div className="bg-gray-50 rounded-2xl p-4 text-center group-hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-900">
                  {application.contactPerson}
                </div>
                <div className="text-xs text-gray-500 mt-1">Представитель</div>
              </div>

              {/* Date */}
              <div className="bg-gray-50 rounded-2xl p-4 text-center group-hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(application.createdAt), 'dd.MM.yy')}
                </div>
                <div className="text-xs text-gray-500 mt-1">Дата подачи</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}