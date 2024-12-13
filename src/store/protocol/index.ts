import { create } from 'zustand';
import { Protocol } from '../../types';
import { supabase } from '../../lib/supabase';
import { fetchProtocolsQuery, signProtocolQuery, submitProtocolQuery, markAsPaidQuery } from './queries';

interface ProtocolState {
  protocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  signProtocol: (protocolId: string, userId: string) => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  protocols: [],

  fetchProtocols: async () => {
    try {
      const protocolsData = await fetchProtocolsQuery();
      
      const protocols: Protocol[] = protocolsData.map(protocol => ({
        id: protocol.id,
        tenderId: protocol.tender_id,
        type: protocol.type || 'tender',
        status: protocol.status,
        financeStatus: protocol.finance_status || 'not_submitted',
        urgency: protocol.urgency,
        submittedAt: protocol.submitted_at,
        paidAt: protocol.paid_at,
        createdAt: protocol.created_at,
        number: protocol.number,
        department: protocol.department,
        signatures: protocol.signatures?.map((sig: any) => ({
          userId: sig.user_id,
          date: sig.date
        })) || [],
        tender: protocol.type === 'tender' && protocol.tender ? {
          id: protocol.tender.id,
          requestId: protocol.tender.request_id,
          status: protocol.tender.status,
          winnerId: protocol.tender.winner_id || '',
          winnerReason: protocol.tender.winner_reason,
          createdAt: protocol.tender.created_at,
          suppliers: protocol.tender.suppliers?.map((s: any) => ({
            id: s.id,
            companyName: s.company_name,
            contactPerson: s.contact_person,
            contactNumber: s.contact_number,
            deliveryTime: s.delivery_time,
            pricePerUnit: s.price_per_unit,
            price: s.price,
            includeTax: s.include_tax,
            proposalUrl: s.proposal_url,
            createdBy: s.created_by,
            createdAt: s.created_at
          })) || [],
          request: protocol.tender.request ? {
            id: protocol.tender.request.id,
            type: 'transfer',
            number: protocol.tender.request.number,
            date: protocol.tender.request.date,
            department: protocol.tender.request.department,
            documentUrl: protocol.tender.request.document_url,
            status: protocol.tender.request.status,
            createdAt: protocol.tender.request.created_at,
            createdBy: protocol.tender.request.created_by,
            signatures: [], // Required by BaseRequest
            categories: protocol.tender.request.categories || [],
            items: protocol.tender.request.items?.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              objectType: item.object_type,
              unitType: item.unit_type,
              quantity: item.quantity,
              deadline: item.deadline
            })) || []
          } : undefined
        } : undefined,
        request: protocol.type === 'cash' && protocol.request ? {
          id: protocol.request.id,
          type: 'cash',
          number: protocol.request.number,
          date: protocol.request.date,
          department: protocol.request.department,
          status: protocol.request.status,
          createdAt: protocol.request.created_at,
          createdBy: protocol.request.created_by,
          signatures: [], // Required by BaseRequest
          categories: protocol.request.categories || [],
          items: protocol.request.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            totalSum: item.total_sum || 0 // Ensure we map total_sum and provide a default value
          })) || []
        } : undefined
      }));

      console.log('Mapped protocols:', protocols); // Add logging to debug
      set({ protocols });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw error;
    }
  },

  signProtocol: async (protocolId: string, userId: string) => {
    try {
      await signProtocolQuery(protocolId, userId, new Date().toISOString());
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error signing protocol:', error);
      throw error;
    }
  },

  submitProtocol: async (protocolId: string, urgency: 'high' | 'low') => {
    try {
      await submitProtocolQuery(protocolId, urgency);
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error submitting protocol:', error);
      throw error;
    }
  },

  markAsPaid: async (protocolId: string) => {
    try {
      await markAsPaidQuery(protocolId);
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error marking protocol as paid:', error);
      throw error;
    }
  }
}));

export * from './types';
