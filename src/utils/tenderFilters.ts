import { Tender, Request } from '../types';

export function filterTendersByCategory(
  tenders: Tender[], 
  requests: Request[],
  supplierCategories: string[]
): Tender[] {
  return tenders.filter(tender => {
    const request = requests.find(r => r.id === tender.requestId);
    if (!request?.categories?.length || !supplierCategories?.length) return false;

    return request.categories.some(category => 
      supplierCategories.includes(category)
    );
  }).filter(tender => tender.status === 'active');
}