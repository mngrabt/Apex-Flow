import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProtocolStore } from '../../store/protocol';
import { Protocol, CashRequestItem, RequestSignature } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Download, FileText, User2, CheckCircle2, Clock, Pen } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';

// Define required signers for cash requests (only 3 instead of 4)
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
  }
];

interface CashRequestDetailsProps {
  backState?: {
    from?: string;
    view?: string;
  };
}

export default function CashRequestDetails({ backState }: CashRequestDetailsProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore(state => state.user);
  const { protocols, fetchProtocols } = useProtocolStore();
  const [isSigningId, setIsSigningId] = useState<string | null>(null);
  const [requestSignatures, setRequestSignatures] = useState<RequestSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch request signatures directly from the database
  useEffect(() => {
    const fetchRequestSignatures = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('request_signatures')
          .select('*')
          .eq('request_id', id);

        if (error) throw error;

        console.log('Fetched request signatures:', data);
        
        setRequestSignatures(data.map(sig => ({
          userId: sig.user_id,
          date: sig.date
        })));
      } catch (error) {
        console.error('Error fetching request signatures:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequestSignatures();
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProtocols();
      } catch (error) {
        console.error('Error loading protocol data:', error);
      }
    };
    loadData();
  }, [fetchProtocols]);

  if (!user || !id) {
    console.log('No user or id:', { user, id });
    return null;
  }

  // Find protocol by matching request.id with our ID
  const protocolData = protocols?.find(p => {
    const matches = p.type === 'cash' && (p.request?.id === id || p.id === id);
    return matches;
  });

  if (!protocolData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg font-medium text-gray-900">Заявка не найдена</div>
        <button
          onClick={() => navigate('/cash-requests')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку
        </button>
      </div>
    );
  }

  const requestItems = protocolData.request?.items as CashRequestItem[];

  const handleSign = async () => {
    if (!user || !protocolData || !protocolData.request) return;
    try {
      setIsSigningId(protocolData.id);

      // Insert signature directly into request_signatures table
      const { error } = await supabase
        .from('request_signatures')
        .insert({
          request_id: id,
          user_id: user.id,
          date: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh signatures
      const { data: newSignatures } = await supabase
        .from('request_signatures')
        .select('*')
        .eq('request_id', id);

      setRequestSignatures(newSignatures.map(sig => ({
        userId: sig.user_id,
        date: sig.date
      })));

      // Check if all required signatures are present
      const allSigned = REQUIRED_SIGNERS.every(signer => 
        newSignatures.some(sig => sig.user_id === signer.id)
      );

      if (allSigned) {
        navigate('/cash-requests');
      }
    } catch (error) {
      console.error('Error signing request:', error);
    } finally {
      setIsSigningId(null);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'd MMMM в HH:mm', { locale: ru });
  };

  const canSign = user && REQUIRED_SIGNERS.some(signer => {
    // First check if this user is even in the list of required signers
    if (signer.id !== user.id) {
      return false;
    }

    // Then check if they haven't signed yet
    const hasNotSigned = !requestSignatures.some(sig => sig.userId === signer.id);
    
    console.log('Checking if can sign:', {
      signer_id: signer.id,
      signer_name: signer.name,
      user_id: user.id,
      hasNotSigned,
      request_signatures: requestSignatures
    });

    // User can only sign if they are a required signer AND haven't signed yet
    return hasNotSigned;
  });

  const handleBack = () => {
    if (backState?.from === 'finances') {
      navigate('/finances', { state: { view: backState.view } });
    } else if (backState?.from === 'archive') {
      navigate('/archive', { state: { view: backState.view } });
    } else {
      navigate('/requests');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {requestItems?.[0]?.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              от {format(new Date(protocolData.createdAt), 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Детали заявки</h2>
              {protocolData.request?.documentUrl && (
                <button
                  onClick={() => window.open(protocolData.request?.documentUrl, '_blank')}
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  Скачать ТЗ
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Request Name and Description */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Название</div>
                    <div className="font-medium text-gray-900">
                      {requestItems?.[0]?.name}
                    </div>
                  </div>
                  {requestItems?.[0]?.description && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Описание</div>
                      <div className="font-medium text-gray-900">
                        {requestItems?.[0]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Дата создания</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(protocolData.request?.createdAt || ''), 'd MMMM yyyy', { locale: ru })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Количество</div>
                  <div className="font-medium text-gray-900">
                    {requestItems?.[0]?.quantity}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Общая сумма</div>
                  <div className="font-medium text-gray-900">
                    {requestItems?.[0]?.totalSum?.toLocaleString()} сум
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Signatures */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Подписи</h2>
            <div className="space-y-6">
              {/* Signatures List */}
              <div className="space-y-3">
                {REQUIRED_SIGNERS.map((signer) => {
                  const signature = requestSignatures.find(s => s.userId === signer.id);
                  console.log('Rendering signature row:', {
                    signer_id: signer.id,
                    signer_name: signer.name,
                    found_signature: signature,
                    all_signatures: requestSignatures
                  });
                  const isCurrentUser = user?.id === signer.id;
                  
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
              {canSign && (
                <button
                  onClick={handleSign}
                  disabled={isSigningId === protocolData.id}
                  className={`
                    w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    text-sm font-medium transition-all
                    ${isSigningId === protocolData.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
                    }
                  `}
                >
                  <User2 className="w-4 h-4" />
                  {isSigningId === protocolData.id ? 'Подписание...' : 'Подписать заявку'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 