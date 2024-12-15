export type User = {
  id: string;
  email: string;
  role: 'A' | 'S';
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  deliveryTime: number;
  pricePerUnit: number;
  price: number;
  includeTax: boolean;
  proposalUrl: string | null;
  createdBy: string;
  createdAt: string;
  categories?: string[];
};

export type Tender = {
  id: string;
  requestId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  suppliers?: Supplier[];
  winnerId?: string;
  winnerReason?: string;
  reserveWinnerId?: string;
  reserveWinnerReason?: string;
};

export interface Request {
  id: string;
  type: 'transfer' | 'cash';
  number: string;
  date: string;
  department: string;
  status: string;
  createdAt: string;
  createdBy: string;
  categories: string[];
  request_signatures?: RequestSignature[];
  items: RequestItem[];
  documentUrl?: string;
}

export interface RequestSignature {
  userId: string;
  date: string;
}

export interface RequestItem {
  id: string;
  name: string;
  description?: string;
  objectType?: string;
  unitType?: string;
  quantity: number;
  deadline?: string;
  totalSum?: number;
}

export interface CashRequestItem extends RequestItem {
  totalSum: number;
}

export interface Protocol {
  id: string;
  tenderId?: string;
  type: 'tender' | 'cash';
  status: string;
  financeStatus: string;
  urgency?: 'high' | 'low';
  submittedAt?: string;
  paidAt?: string;
  createdAt: string;
  number: string;
  department: string;
  signatures: RequestSignature[];
  tender?: Tender;
  request?: Request;
}

// ... rest of the types ... 