import { create } from 'zustand';
import { Protocol, RequestSignature } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  fetchProtocolsQuery, 
  fetchCompletedProtocolsQuery,
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
  completedProtocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  fetchCompletedProtocols: () => Promise<void>;
  signProtocol: (protocolId: string, userId: string) => Promise<void>;
  signCashRequest: (requestId: string, userId: string) => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
  createFromTender: (tenderId: string) => Promise<void>;
  updateProtocolNumber: (protocolId: string, number: string) => Promise<void>;
}

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  protocols: [],
  completedProtocols: [],

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
        signatures: protocol.signatures?.map(sig => ({
          userId: sig.user_id,
          date: sig.date
        })) || [],
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
          request_signatures: protocol.request.request_signatures?.map(sig => ({
            userId: sig.user_id,
            date: sig.date
          })) || [],
          categories: protocol.request.categories || [],
          items: protocol.request.items?.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            totalSum: item.total_sum || 0
          })) || []
        } : undefined
      }));
      
      set({ protocols });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw error;
    }
  },

  fetchCompletedProtocols: async () => {
    try {
      const protocolsData = await fetchCompletedProtocolsQuery();
      
      const completedProtocols: Protocol[] = protocolsData.map(protocol => ({
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
        signatures: protocol.signatures?.map(sig => ({
          userId: sig.user_id,
          date: sig.date
        })) || [],
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
          request_signatures: protocol.request.request_signatures?.map(sig => ({
            userId: sig.user_id,
            date: sig.date
          })) || [],
          categories: protocol.request.categories || [],
          items: protocol.request.items?.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            totalSum: item.total_sum || 0
          })) || []
        } : undefined
      }));
      
      set({ completedProtocols });
    } catch (error) {
      console.error('Error fetching completed protocols:', error);
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
      
      console.log('Starting protocol signing process:', {
        protocolId,
        userId,
        currentDate
      });

      // Get initial protocol state
      const { data: initialProtocol, error: initialError } = await supabase
        .from('protocols')
        .select(`
          *,
          signatures:protocol_signatures(user_id, date)
        `)
        .eq('id', protocolId)
        .single();

      if (initialError) {
        console.error('Error fetching initial protocol state:', initialError);
        throw initialError;
      }

      if (!initialProtocol) {
        console.error('Protocol not found:', protocolId);
        throw new Error('Protocol not found');
      }

      // Check if user has already signed
      if (initialProtocol.signatures?.some(sig => sig.user_id === userId)) {
        console.log('User has already signed this protocol');
        return;
      }

      // Add the signature with type field
      const { error: signatureError } = await supabase
        .from('protocol_signatures')
        .insert({
          protocol_id: protocolId,
          user_id: userId,
          date: currentDate
        });

      if (signatureError) {
        console.error('Error adding signature:', signatureError);
        throw signatureError;
      }

      // Get protocol with all signatures to check if it's complete
      const { data: protocol, error: fetchError } = await supabase
        .from('protocols')
        .select(`
          *,
          signatures:protocol_signatures(
            user_id,
            date
          ),
          request:requests(
            department,
            number,
            items:request_items(
              name
            )
          )
        `)
        .eq('id', protocolId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated protocol:', fetchError);
        throw fetchError;
      }

      if (!protocol) {
        console.error('Updated protocol not found:', protocolId);
        throw new Error('Updated protocol not found');
      }

      // Required signers for regular protocols
      const requiredSigners = [
        '00000000-0000-0000-0000-000000000001', // Abdurauf
        '00000000-0000-0000-0000-000000000003', // Fozil
        '00000000-0000-0000-0000-000000000004', // Aziz
        '00000000-0000-0000-0000-000000000005'  // Umar
      ];

      const hasAllSignatures = requiredSigners.every(id => 
        protocol.signatures?.some(sig => sig.user_id === id)
      );

      if (hasAllSignatures) {
        // Update protocol status to completed
        const { error: updateError } = await supabase
          .from('protocols')
          .update({ 
            status: 'completed',
            completed_at: currentDate
          })
          .eq('id', protocolId);

        if (updateError) {
          console.error('Error updating protocol status:', updateError);
          throw updateError;
        }

        // Send notification about protocol needing a number
        await sendNotification('PROTOCOL_NEEDS_NUMBER', {
          name: protocol.request?.items?.[0]?.name || `Протокол #${protocolId}`,
          type: protocol.type || 'tender',
          department: protocol.department || protocol.request?.department,
          requestNumber: protocol.request?.number
        });
      }

      // Fetch fresh data
      await get().fetchProtocols();
      await get().fetchCompletedProtocols();
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
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error updating protocol number:', error);
      throw error;
    }
  }
}));

export * from './types';
