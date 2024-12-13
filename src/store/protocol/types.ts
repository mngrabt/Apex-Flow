import { Supplier, Request } from '../../types';

export interface Protocol {
  id: string;
  tenderId?: string;
  type: 'tender' | 'cash';
  status: string;
  financeStatus: 'not_submitted' | 'submitted' | 'paid';
  urgency?: 'high' | 'low';
  submittedAt?: string;
  paidAt?: string;
  createdAt: string;
  number?: string;
  department?: string;
  items?: CashRequestItem[];
  totalSum?: number;
  signatures: ProtocolSignature[];
  tender?: Tender;
  request?: Request;
}

export interface ProtocolSignature {
  userId: string;
  date: string;
}

export interface Tender {
  id: string;
  requestId: string;
  status: string;
  winnerId: string;
  winnerReason?: string;
  createdAt: string;
  suppliers: Supplier[];
  request?: Request;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson?: string;
  contactNumber?: string;
  deliveryTime: number;
  pricePerUnit: number;
  price: number;
  includeTax: boolean;
  proposalUrl?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Request {
  id: string;
  number: string;
  date: string;
  department: string;
  status: string;
  createdAt: string;
  createdBy: string;
  categories: string[];
  items: RequestItem[];
}

export interface RequestItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
}

export interface CashRequestItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  totalSum: number;
}

export interface ProtocolState {
  protocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  signProtocol: (protocolId: string, userId: string) => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
}
