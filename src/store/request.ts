import { create } from 'zustand';
import { Request, TransferRequest } from '../types';
import { supabase } from '../lib/supabase';
import { useTenderStore } from './tender';

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface RequestStore {
  requests: Request[];
  addRequest: (request: Omit<Request, 'id'>) => Promise<void>;
  fetchRequests: () => Promise<void>;
  updateRequest: (id: string, request: Partial<Request>) => Promise<void>;
  subscribeToSignatures: () => () => void;
  signRequest: (requestId: string, userId: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
}

const REQUIRED_SIGNATURES = [
  '00000000-0000-0000-0000-000000000001', // Abdurauf
  '00000000-0000-0000-0000-000000000003', // Fozil
  '00000000-0000-0000-0000-000000000004'  // Aziz
];

export const useRequestStore = create<RequestStore>((set, get) => ({
  requests: [],

  addRequest: async (request) => {
    try {
      // Validate request data
      if (!request.items || request.items.length === 0) {
        throw new Error('Request must have at least one item');
      }

      // For cash requests, validate total_sum
      if (request.type === 'cash') {
        const item = request.items[0];
        if (!item.totalSum || item.totalSum <= 0) {
          throw new Error('Cash request must have a positive total sum');
        }
      }

      // Prepare the database request object
      const dbRequest = {
        number: request.number || '',
        date: request.date || new Date().toISOString(),
        department: request.department,
        status: request.status || 'draft',
        type: request.type,
        categories: request.type === 'transfer' ? (request as TransferRequest).categories : null,
        created_by: request.createdBy,
        created_at: new Date().toISOString(),
        document_url: request.documentUrl // Add document URL to the initial request
      };

      // Insert the request first
      const { data: requestData, error } = await supabase
        .from('requests')
        .insert([dbRequest])
        .select('*')
        .single();

      if (error) throw error;

      // Insert items into request_items table
      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(request.items.map(item => ({
          request_id: requestData.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          total_sum: request.type === 'cash' ? item.totalSum : null,
          object_type: request.type === 'transfer' ? (item as any).objectType : null,
          unit_type: request.type === 'transfer' ? (item as any).unitType : null,
          deadline: request.type === 'transfer' ? (item as any).deadline : null
        })));

      if (itemsError) throw itemsError;

      // For cash requests, insert into cash_requests table
      if (request.type === 'cash') {
        const { error: cashError } = await supabase
          .from('cash_requests')
          .insert({
            id: requestData.id,
            number: requestData.number,
            date: requestData.date,
            department: requestData.department,
            total_sum: request.items[0].totalSum,
            status: requestData.status,
            created_by: requestData.created_by,
            created_at: requestData.created_at
          });

        if (cashError) throw cashError;
      }

      // Add Abdurauf's signature
      const date = new Date().toISOString();
      const { error: signError } = await supabase
        .from('request_signatures')
        .insert({
          request_id: requestData.id,
          user_id: '00000000-0000-0000-0000-000000000001',
          date
        });

      if (signError) throw signError;

      // Fetch the complete request with all relations
      const { data: completeRequest, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          items:request_items(*),
          signatures:request_signatures(
            user_id,
            date
          )
        `)
        .eq('id', requestData.id)
        .single();

      if (fetchError) throw fetchError;

      // Convert to frontend format with all data
      const frontendData = {
        ...completeRequest,
        id: completeRequest.id,
        createdBy: completeRequest.created_by,
        documentUrl: completeRequest.document_url,
        items: completeRequest.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          ...(completeRequest.type === 'transfer' ? {
            objectType: item.object_type,
            unitType: item.unit_type,
            deadline: item.deadline
          } : {
            totalSum: item.total_sum
          })
        })),
        signatures: completeRequest.signatures.map((sig: any) => ({
          userId: sig.user_id,
          date: sig.date
        }))
      };

      // Update local state with complete data
      set((state) => ({
        requests: [...state.requests, frontendData],
      }));

      return frontendData;
    } catch (error) {
      console.error('Error adding request:', error);
      throw error;
    }
  },

  fetchRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          type,
          number,
          date,
          department,
          status,
          created_at,
          created_by,
          document_url,
          categories,
          items:request_items(
            id,
            name,
            description,
            quantity,
            object_type,
            unit_type,
            deadline,
            total_sum
          ),
          signatures:request_signatures(
            user_id,
            date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to frontend format
      const frontendData = data.map(request => ({
        id: request.id,
        type: request.type,
        number: request.number,
        date: request.date,
        department: request.department,
        status: request.status,
        createdAt: request.created_at,
        createdBy: request.created_by,
        documentUrl: request.document_url,
        categories: request.categories || [],
        items: request.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          ...(request.type === 'transfer' ? {
            objectType: item.object_type,
            unitType: item.unit_type,
            deadline: item.deadline
          } : {
            totalSum: item.total_sum
          })
        })),
        signatures: (request.signatures || []).map((sig: { user_id: string; date: string }) => ({
          userId: sig.user_id,
          date: sig.date
        }))
      }));

      set({ requests: frontendData });
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  updateRequest: async (id, request) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update(request)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? { ...r, ...data } : r)),
      }));
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  },

  signRequest: async (requestId: string, userId: string) => {
    try {
      const date = new Date().toISOString();

      // Add signature
      const { error: signError } = await supabase
        .from('request_signatures')
        .insert({
          request_id: requestId,
          user_id: userId,
          date
        });

      if (signError) throw signError;

      // Get all signatures for this request
      const { data: signatures, error: sigError } = await supabase
        .from('request_signatures')
        .select('user_id, date')
        .eq('request_id', requestId);

      if (sigError) throw sigError;

      // Get request type
      const request = get().requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Check if all required signatures are present
      const hasAllSignatures = [
        '00000000-0000-0000-0000-000000000001', // Abdurauf
        '00000000-0000-0000-0000-000000000003', // Fozil
        '00000000-0000-0000-0000-000000000004'  // Aziz
      ].every(requiredId => 
        signatures.some(sig => sig.user_id === requiredId)
      );

      if (hasAllSignatures) {
        if (request.type === 'cash') {
          // Create cash protocol with automatic Abdurauf signature
          const { error: protocolError } = await supabase.rpc('create_cash_protocol', {
            p_request_id: requestId,
            p_current_date: date
          });

          if (protocolError) throw protocolError;
        } else if (request.type === 'transfer') {
          // First update request status to pending to avoid constraint violation
          const { error: updateError } = await supabase
            .from('requests')
            .update({ status: 'pending' })
            .eq('id', requestId);

          if (updateError) throw updateError;

          // Create tender
          const { error: tenderError } = await supabase
            .from('tenders')
            .insert({
              request_id: requestId,
              status: 'active',
              created_at: date
            });

          if (tenderError) throw tenderError;

          // Update request status to tender
          const { error: finalUpdateError } = await supabase
            .from('requests')
            .update({ status: 'tender' })
            .eq('id', requestId)
            .eq('status', 'pending'); // Only update if still in pending state

          if (finalUpdateError) throw finalUpdateError;
        }
      }

      await get().fetchRequests();
    } catch (error) {
      console.error('Error signing request:', error);
      throw error;
    }
  },

  deleteRequest: async (id: string) => {
    try {
      // First, check if it's a cash request
      const request = get().requests.find(r => r.id === id);
      if (!request) throw new Error('Request not found');

      if (request.type === 'cash') {
        // Delete from cash_requests first
        const { error: cashError } = await supabase
          .from('cash_requests')
          .delete()
          .eq('id', id);

        if (cashError) throw cashError;
      }

      // Delete request items
      const { error: itemsError } = await supabase
        .from('request_items')
        .delete()
        .eq('request_id', id);

      if (itemsError) throw itemsError;

      // Delete request signatures
      const { error: signaturesError } = await supabase
        .from('request_signatures')
        .delete()
        .eq('request_id', id);

      if (signaturesError) throw signaturesError;

      // Finally delete the request itself
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        requests: state.requests.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },

  subscribeToSignatures: () => {
    const channel = supabase
      .channel('request_signatures')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'request_signatures'
      } as any, async (payload: { 
        new: { request_id: string } | null;
        old: { request_id: string } | null;
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      }) => {
        // Refresh the specific request that was updated
        if (payload.new?.request_id) {
          const { data: requestData, error } = await supabase
            .from('requests')
            .select(`
              *,
              items:request_items(*),
              signatures:request_signatures(
                user_id,
                date
              )
            `)
            .eq('id', payload.new.request_id)
            .single();

          if (error) {
            console.error('Error fetching updated request:', error);
            return;
          }

          // Convert to frontend format
          const updatedRequest = {
            ...requestData,
            id: requestData.id,
            createdBy: requestData.created_by,
            documentUrl: requestData.document_url,
            items: requestData.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              ...(requestData.type === 'transfer' ? {
                objectType: item.object_type,
                unitType: item.unit_type,
                deadline: item.deadline
              } : {
                totalSum: item.total_sum
              })
            })),
            signatures: (requestData.signatures || []).map((sig: { user_id: string; date: string }) => ({
              userId: sig.user_id,
              date: sig.date
            }))
          };

          // Update the specific request in the store
          set((state) => ({
            requests: state.requests.map((request) =>
              request.id === updatedRequest.id ? updatedRequest : request
            )
          }));
        }
      })
      .subscribe();

    // Return cleanup function
    return () => {
      channel.unsubscribe();
    };
  }
}));