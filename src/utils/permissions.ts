export interface UserPermissions {
  canSignRequests: boolean;
  canSignProtocols: boolean;
  canAddSuppliers: boolean;
  canCreateTasks: boolean;
  canMarkAsPaid: boolean;
  canAssignDates: boolean;
  canModifyCalendar: boolean;
  canViewFinanceWaiting: boolean;
  canViewFinancePaid: boolean;
  canViewTenders: boolean;
  canAddToTender: boolean;
  tenderCategories?: string[];
}

export function getUserPermissions(userId: string): UserPermissions {
  // First check if it's a supplier
  if (!userId.startsWith('00000000-0000-0000-0000-')) {
    return {
      canSignRequests: false,
      canSignProtocols: false,
      canAddSuppliers: false,
      canCreateTasks: false,
      canMarkAsPaid: false,
      canAssignDates: false,
      canModifyCalendar: false,
      canViewFinanceWaiting: false,
      canViewFinancePaid: false,
      canViewTenders: true,
      canAddToTender: true,
      tenderCategories: ['all'] // Suppliers can view all tenders by default
    };
  }

  switch (userId) {
    // Aziz - sign requests and protocols
    case '00000000-0000-0000-0000-000000000004':
      return {
        canSignRequests: true,
        canSignProtocols: true,
        canAddSuppliers: false,
        canCreateTasks: false,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: false,
        canAddToTender: false
      };

    // Umarali - full finance access
    case '00000000-0000-0000-0000-000000000006':
      return {
        canSignRequests: false,
        canSignProtocols: true,
        canAddSuppliers: false,
        canCreateTasks: false,
        canMarkAsPaid: true,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: true,
        canViewFinancePaid: true,
        canViewTenders: false,
        canAddToTender: false
      };

    // Fozil - sign requests, protocols, add suppliers
    case '00000000-0000-0000-0000-000000000003':
      return {
        canSignRequests: true,
        canSignProtocols: true,
        canAddSuppliers: true,
        canCreateTasks: false,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: true,
        canAddToTender: false
      };

    // Abdurauf - everything except tasks and finance payment
    case '00000000-0000-0000-0000-000000000001':
      return {
        canSignRequests: true,
        canSignProtocols: true,
        canAddSuppliers: true,
        canCreateTasks: false,
        canMarkAsPaid: false,
        canAssignDates: true,
        canModifyCalendar: true,
        canViewFinanceWaiting: true,
        canViewFinancePaid: true,
        canViewTenders: true,
        canAddToTender: false
      };

    // Dinara - only view archive
    case '00000000-0000-0000-0000-000000000005':
      return {
        canSignRequests: false,
        canSignProtocols: false,
        canAddSuppliers: false,
        canCreateTasks: false,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: false,
        canAddToTender: false
      };

    // Umar - create tasks, view archive and calendar
    case '00000000-0000-0000-0000-000000000007':
      return {
        canSignRequests: false,
        canSignProtocols: false,
        canAddSuppliers: false,
        canCreateTasks: true,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: false,
        canAddToTender: false
      };

    // Akmal - create tasks, view calendar
    case '00000000-0000-0000-0000-000000000008':
      return {
        canSignRequests: false,
        canSignProtocols: false,
        canAddSuppliers: false,
        canCreateTasks: true,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: false,
        canAddToTender: false
      };

    // Sherzod - view waiting/paid finances, mark as paid
    case '00000000-0000-0000-0000-000000000009':
      return {
        canSignRequests: false,
        canSignProtocols: false,
        canAddSuppliers: false,
        canCreateTasks: false,
        canMarkAsPaid: true,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: true,
        canViewFinancePaid: true,
        canViewTenders: false,
        canAddToTender: false
      };

    // Default supplier permissions
    default:
      return {
        canSignRequests: false,
        canSignProtocols: false,
        canAddSuppliers: false,
        canCreateTasks: false,
        canMarkAsPaid: false,
        canAssignDates: false,
        canModifyCalendar: false,
        canViewFinanceWaiting: false,
        canViewFinancePaid: false,
        canViewTenders: true,
        canAddToTender: true,
        tenderCategories: ['all']
      };
  }
}