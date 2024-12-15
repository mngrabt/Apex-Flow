import { Supplier, Request, Protocol, RequestSignature, CashRequestItem, RequestItem } from '../../types';

export interface ProtocolState {
  protocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  signProtocol: (protocolId: string, userId: string) => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
}
