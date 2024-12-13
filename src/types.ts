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