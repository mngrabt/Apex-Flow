import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Protocol } from '../../types';
import { useAuthStore } from '../../store/auth';
import { CheckCircle2, Clock, Pen, User2 } from 'lucide-react';

interface ProtocolSignaturesProps {
  protocol: Protocol;
  onSign?: () => void;
  isSigningId: string | null;
}

const REQUIRED_SIGNERS = [
  {
    id: '00000000-0000-0000-0000-000000000004',
    role: 'Директор',
    name: 'Азиз'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    role: 'Член Фин. Группы',
    name: 'Фозил'
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'Продакшн Менеджер',
    name: 'Абдурауф'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    role: 'Руководитель Отдела Снабжения',
    name: 'Умарали'
  }
];

export default function ProtocolSignatures({
  protocol,
  onSign,
  isSigningId
}: ProtocolSignaturesProps) {
  const currentUser = useAuthStore(state => state.user);

  const formatDate = (date: string) => {
    return format(new Date(date), 'd MMMM в HH:mm', { locale: ru });
  };

  const canSign = currentUser && REQUIRED_SIGNERS.some(signer => 
    signer.id === currentUser.id && 
    !protocol.signatures.some(sig => sig.userId === currentUser.id)
  );

  return (
    <div className="space-y-6">
      {/* Signatures List */}
      <div className="space-y-3">
        {REQUIRED_SIGNERS.map((signer) => {
          const signature = protocol.signatures.find(s => s.userId === signer.id);
          const isCurrentUser = currentUser?.id === signer.id;
          
          return (
            <div 
              key={signer.id}
              className={`
                relative overflow-hidden rounded-xl border transition-all
                ${signature 
                  ? 'bg-white border-primary/20' 
                  : 'bg-gray-50 border-gray-100'
                }
                ${isCurrentUser && !signature ? 'hover:border-primary/40' : ''}
              `}
            >
              {/* Signature Status Indicator */}
              <div className="absolute top-0 left-0 h-full w-1 bg-primary/10" />

              <div className="p-4 pl-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${signature ? 'bg-primary/10' : 'bg-gray-100'}
                    `}>
                      {signature ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : isCurrentUser ? (
                        <Pen className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {signer.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Вы
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 hidden lg:block">
                        {signer.role}
                      </div>
                    </div>
                  </div>

                  {signature ? (
                    <div className="text-sm text-primary font-medium">
                      {formatDate(signature.date)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      Ожидает подписи
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sign Button */}
      {canSign && onSign && (
        <button
          onClick={onSign}
          disabled={isSigningId === protocol.id}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            text-sm font-medium transition-all
            ${isSigningId === protocol.id
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
            }
          `}
        >
          <User2 className="w-4 h-4" />
          {isSigningId === protocol.id ? 'Подписание...' : 'Подписать протокол'}
        </button>
      )}
    </div>
  );
}