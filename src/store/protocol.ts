import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Protocol, ProtocolState } from './protocol/types';

export const useProtocolStore = create<ProtocolState>((set, get) => {
  // Set up real-time subscription
  const channel = supabase.channel('protocol_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'protocols'
    }, () => {
      // Refetch protocols when changes occur
      get().fetchProtocols();
    })
    .subscribe();

  return {
    protocols: [],

    fetchProtocols: async () => {
      try {
        console.log('Fetching protocols...');
        const { data, error } = await supabase
          .from('protocols')
          .select(`
            id,
            tender_id,
            request_id,
            type,
            status,
            finance_status,
            urgency,
            submitted_at,
            paid_at,
            created_at,
            number,
            department,
            signatures:protocol_signatures(
              user_id,
              date
            ),
            tender:tenders!protocols_tender_id_fkey(
              id,
              request_id,
              status,
              winner_id,
              winner_reason,
              created_at,
              suppliers:suppliers!suppliers_tender_id_fkey(
                id,
                company_name,
                contact_person,
                contact_number,
                delivery_time,
                price_per_unit,
                price,
                include_tax,
                proposal_url,
                created_by,
                created_at
              ),
              request:requests!tenders_request_id_fkey(
                id,
                number,
                date,
                department,
                document_url,
                status,
                created_at,
                created_by,
                categories,
                items:request_items(
                  id,
                  name,
                  description,
                  object_type,
                  unit_type,
                  quantity,
                  deadline
                )
              )
            ),
            request:requests!protocols_request_id_fkey(
              id,
              number,
              date,
              department,
              status,
              created_at,
              created_by,
              categories,
              items:request_items(
                id,
                name,
                description,
                quantity,
                total_sum
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching protocols:', error);
          throw error;
        }

        console.log('Fetched protocols:', data);

        if (data) {
          const protocols: Protocol[] = data.map(protocol => ({
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
            items: protocol.type === 'cash' ? protocol.request?.items : undefined,
            signatures: protocol.signatures?.map((sig: any) => ({
              userId: sig.user_id,
              date: sig.date
            })) || [],
            tender: protocol.tender ? {
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
                number: protocol.tender.request.number,
                date: protocol.tender.request.date,
                department: protocol.tender.request.department,
                documentUrl: protocol.tender.request.document_url,
                status: protocol.tender.request.status,
                createdAt: protocol.tender.request.created_at,
                createdBy: protocol.tender.request.created_by,
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
            request: protocol.request ? {
              id: protocol.request.id,
              number: protocol.request.number,
              date: protocol.request.date,
              department: protocol.request.department,
              status: protocol.request.status,
              createdAt: protocol.request.created_at,
              createdBy: protocol.request.created_by,
              categories: protocol.request.categories || [],
              items: protocol.request.items?.map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                totalSum: item.total_sum
              })) || []
            } : undefined
          }));

          console.log('Mapped protocols:', protocols);
          set({ protocols });
        }
      } catch (error) {
        console.error('Error in fetchProtocols:', error);
        throw error;
      }
    },

    fetchProtocolDetails: async (protocolId: string) => {
      try {
        const { data, error } = await supabase
          .from('protocols')
          .select(`
            *,
            signatures:protocol_signatures(
              user_id,
              date
            ),
            tender:tenders!protocols_tender_id_fkey(
              id,
              request_id,
              status,
              winner_id,
              winner_reason,
              created_at,
              suppliers:suppliers!suppliers_tender_id_fkey(*),
              request:requests!tenders_request_id_fkey(
                id,
                number,
                date,
                department,
                document_url,
                status,
                created_at,
                created_by,
                items:request_items(*)
              )
            )
          `)
          .eq('id', protocolId)
          .single();

        if (error) throw error;

        if (data) {
          const protocol = data;
          const item = protocol.tender?.request?.items[0];
          const winner = protocol.tender?.suppliers.find(s => s.id === protocol.tender?.winner_id);

          return {
            requestName: item?.name || '',
            requestDescription: item?.description || '',
            requestQuantity: item?.quantity || 0,
            requestUnitType: item?.unit_type || '',
            requestDeadline: item?.deadline || 0,
            requestObjectType: item?.object_type || 'office',
            requestDocumentUrl: protocol.tender?.request?.document_url,
            winnerReason: protocol.tender?.winner_reason
          };
        }

        return null;
      } catch (error) {
        console.error('Error fetching protocol details:', error);
        throw error;
      }
    },

    signProtocol: async (protocolId: string, userId: string) => {
      try {
        const { error } = await supabase.rpc('sign_and_complete_protocol', {
          p_protocol_id: protocolId,
          p_user_id: userId,
          p_current_date: new Date().toISOString()
        });

        if (error) throw error;

        await get().fetchProtocols();
      } catch (error) {
        console.error('Error signing protocol:', error);
        throw error;
      }
    },

    submitProtocol: async (protocolId: string, urgency: 'high' | 'low') => {
      try {
        const { error } = await supabase.rpc('submit_protocol', {
          p_protocol_id: protocolId,
          p_urgency: urgency,
          p_current_date: new Date().toISOString()
        });

        if (error) throw error;

        await get().fetchProtocols();
      } catch (error) {
        console.error('Error submitting protocol:', error);
        throw error;
      }
    },

    markAsPaid: async (protocolId: string) => {
      try {
        const { error } = await supabase.rpc('mark_protocol_as_paid', {
          p_protocol_id: protocolId,
          p_current_date: new Date().toISOString()
        });

        if (error) throw error;

        await get().fetchProtocols();
      } catch (error) {
        console.error('Error marking protocol as paid:', error);
        throw error;
      }
    }
  };
});