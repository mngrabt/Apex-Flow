import { format } from 'date-fns';
import { Request } from '../../types';
import { useAuthStore } from '../../store/auth';

interface RequestSignaturesProps {
  request: Request;
  canSign: boolean;
  isSigningId: string | null;
  onSign: (id: string) => void;
}

export default function RequestSignatures({
  request,
  canSign,
  isSigningId,
  onSign
}: RequestSignaturesProps) {
  const users = useAuthStore(state => state.users);

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yy');
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return '';

    switch (user.name) {
      case 'Abdurauf': return 'Абдурауф';
      case 'Fozil': return 'Фозил';
      case 'Aziz': return 'Азиз';
      case 'Umar': return 'Умар';
      case 'Shohruh': return 'Шохрух';
      default: return user.name;
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-6">
      <h5 className="text-sm font-bold text-gray-500 mb-4">Подписи</h5>
      <div className="grid grid-cols-3 gap-4">
        {['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'].map((userId) => {
          const signature = request.signatures.find((s) => s.userId === userId);
          const userName = getUserName(userId);
          
          return (
            <div key={userId} className="flex items-center justify-between bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2">
                {signature ? (
                  <div className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                ) : (
                  <div className="h-2 w-2 rounded-full border border-gray-300" />
                )}
                <span className="text-gray-500 font-bold">{userName}</span>
              </div>
              {signature && (
                <span className="text-gray-400 text-sm font-bold">
                  {formatDate(signature.date)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {canSign && (
        <button
          onClick={() => onSign(request.id)}
          disabled={isSigningId === request.id}
          className="mt-6 w-full px-4 py-3 bg-[#ff6b00] text-white rounded-lg transition-colors hover:bg-[#ff6b00]/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
        >
          {isSigningId === request.id ? 'Подписание...' : 'Подписать документ'}
        </button>
      )}
    </div>
  );
}