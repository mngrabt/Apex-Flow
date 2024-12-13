// Add SupplierApplication interface
export interface SupplierApplication {
  id: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  telegramNumber: string;
  isTelegramSame: boolean;
  telegramChatId?: number;
  isVatPayer: boolean;
  vatCertificateUrl?: string;
  categories: string[];
  licenseUrl?: string;
  passportUrl?: string;
  formUrl?: string;
  email: string;
  inn: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  username?: string;
  password?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ArchivedProtocol {
  id: string;
  type: 'cash' | 'tender';
  tenderId?: string;
  status: string;
  financeStatus?: string;
  createdAt: string;
  zipUrl?: string;
  number?: string;
  department?: string;
  request?: {
    id: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      quantity: number;
      totalSum?: number;
    }>;
  };
  tender?: {
    id: string;
    request?: {
      id: string;
      department?: string;
      items: Array<{
        id: string;
        name: string;
        description?: string;
        quantity: number;
        unitType?: string;
        deadline?: number;
      }>;
    };
    createdAt: string;
  };
  signatures: Array<{
    userId: string;
    date: string;
  }>;
}