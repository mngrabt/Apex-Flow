import { create } from 'zustand';
import { Protocol, RequestSignature } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  fetchProtocolsQuery, 
  signProtocolQuery, 
  signCashRequestQuery, 
  submitProtocolQuery, 
  markAsPaidQuery,
  createProtocolFromTender,
  updateProtocolNumberQuery,
  markProtocolAsPaidQuery
} from './queries';
import { sendNotification } from '../../services/notificationService';

interface ProtocolState {
  protocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  signProtocol: (protocolId: string, userId: string) => Promise<void>;
  signCashRequest: (requestId: string, userId: string) => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
  createFromTender: (tenderId: string) => Promise<void>;
  updateProtocolNumber: (protocolId: string, number: string) => Promise<void>;
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  protocols: [],

  fetchProtocols: async () => {
    try {
      const protocolsData = await fetchProtocolsQuery();
      
      const protocols: Protocol[] = protocolsData.map(protocol => {
        console.log('Processing protocol:', {
          id: protocol.id,
          type: protocol.type,
          request: protocol.request,
          signatures: protocol.signatures,
          request_signatures: protocol.request?.request_signatures
        });

        // Map the request signatures if they exist
        const requestSignatures: RequestSignature[] = protocol.request?.request_signatures?.map(sig => ({
          userId: sig.user_id,
          date: sig.date
        })) || [];

        // Map protocol signatures
        const protocolSignatures: RequestSignature[] = protocol.signatures?.map(sig => ({
          userId: sig.user_id,
          date: sig.date
        })) || [];

        console.log('Mapped signatures:', {
          protocol_id: protocol.id,
          protocol_signatures: protocolSignatures,
          request_signatures: requestSignatures
        });

        return {
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
          signatures: protocolSignatures,
          request: protocol.request ? {
            id: protocol.request.id,
            type: protocol.type || 'tender',
            number: protocol.request.number,
            date: protocol.request.date,
            department: protocol.request.department,
            status: protocol.request.status,
            createdAt: protocol.request.created_at,
            createdBy: protocol.request.created_by,
            documentUrl: protocol.request.document_url,
            request_signatures: requestSignatures,
            categories: protocol.request.categories || [],
            items: protocol.request.items?.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              totalSum: item.total_sum || 0
            })) || []
          } : undefined
        };
      });

      console.log('Final mapped protocols:', protocols.map(p => ({
        id: p.id,
        type: p.type,
        request_id: p.request?.id,
        signatures: p.signatures,
        request_signatures: p.request?.request_signatures
      })));
      
      set({ protocols });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw error;
    }
  },

  createFromTender: async (tenderId: string) => {
    try {
      await createProtocolFromTender(tenderId);
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error creating protocol from tender:', error);
      throw error;
    }
  },

  signProtocol: async (protocolId: string, userId: string) => {
    try {
      const currentDate = new Date().toISOString();
      await signProtocolQuery(protocolId, userId, currentDate);
      
      // Get all signatures for this protocol
      const { data: signatures } = await supabase
        .from('protocol_signatures')
        .select('user_id')
        .eq('protocol_id', protocolId);

      if (!signatures) return;

      // Check if all required signatures are present
      const requiredSigners = [
        '00000000-0000-0000-0000-000000000001', // Abdurauf
        '00000000-0000-0000-0000-000000000003', // Fozil
        '00000000-0000-0000-0000-000000000004', // Aziz
        '00000000-0000-0000-0000-000000000005'  // Umar
      ];

      const hasAllSignatures = requiredSigners.every(id => 
        signatures.some(sig => sig.user_id === id)
      );

      if (hasAllSignatures) {
        // Get protocol details for notification
        const { data: protocol } = await supabase
          .from('protocols')
          .select(`
            *,
            tender:tenders(
              request:requests(
                items:request_items(*)
              )
            ),
            request:requests(
              items:request_items(*)
            )
          `)
          .eq('id', protocolId)
          .single();

        if (protocol) {
          const title = protocol.type === 'cash' 
            ? protocol.request?.items?.[0]?.name 
            : protocol.tender?.request?.items?.[0]?.name;

          await sendNotification('PROTOCOL_NEEDS_NUMBER', {
            name: title || `Протокол #${protocol.id}`
          });
        }
      }

      await get().fetchProtocols();
    } catch (error) {
      console.error('Error signing protocol:', error);
      throw error;
    }
  },

  signCashRequest: async (requestId: string, userId: string) => {
    try {
      // First find the protocol with this request ID
      const protocol = get().protocols.find(p => p.type === 'cash' && p.request?.id === requestId);
      if (!protocol) {
        console.error('Protocol not found for request:', requestId);
        throw new Error('Protocol not found for request');
      }

      console.log('Found protocol for signing:', {
        protocol_id: protocol.id,
        request_id: requestId,
        user_id: userId,
        current_signatures: protocol.request?.request_signatures
      });

      // Sign both protocol and request
      await signCashRequestQuery(protocol.id, requestId, userId, new Date().toISOString());
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error signing cash request:', error);
      throw error;
    }
  },

  submitProtocol: async (protocolId: string, urgency: 'high' | 'low') => {
    try {
      // First submit the protocol
      await submitProtocolQuery(protocolId, urgency);
      
      // Get fresh protocol data from the database to ensure we have the latest
      const { data: protocol } = await supabase
        .from('protocols')
        .select(`
          *,
          tender:tenders(
            request:requests(
              items:request_items(*)
            )
          ),
          request:requests(
            items:request_items(*)
          )
        `)
        .eq('id', protocolId)
        .single();

      if (!protocol) throw new Error('Protocol not found');

      // Get the title from the appropriate request
      const title = protocol.type === 'cash'
        ? protocol.request?.items?.[0]?.name
        : protocol.tender?.request?.items?.[0]?.name;

      // Notify Sherzod about new submitted protocol
      await sendNotification('PROTOCOL_SUBMITTED', {
        name: title || `Протокол #${protocolId}`
      });

      // Refresh the protocols list
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error submitting protocol:', error);
      throw error;
    }
  },

  markAsPaid: async (protocolId: string) => {
    try {
      await markProtocolAsPaidQuery(protocolId);
      
      // Get protocol data
      const protocol = get().protocols.find(p => p.id === protocolId);
      if (!protocol) throw new Error('Protocol not found');

      // Notify Abdurauf that protocol has been paid
      await sendNotification('PROTOCOL_PAID', {
        name: protocol.name || `Протокол #${protocol.id}`
      });

      await get().fetchProtocols();
    } catch (error) {
      console.error('Error marking protocol as paid:', error);
      throw error;
    }
  },

  updateProtocolNumber: async (protocolId: string, number: string) => {
    try {
      await updateProtocolNumberQuery(protocolId, number);
      
      // Get protocol data
      const protocol = get().protocols.find(p => p.id === protocolId);
      if (!protocol) throw new Error('Protocol not found');

      // Notify Umarali that protocol is ready to be submitted
      await sendNotification('PROTOCOL_GOT_NUMBER', {
        name: protocol.name || `Протокол #${protocol.id}`,
        number
      });

      await get().fetchProtocols();
    } catch (error) {
      console.error('Error updating protocol number:', error);
      throw error;
    }
  }
}));

export * from './types';
