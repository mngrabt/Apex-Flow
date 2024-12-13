import { create } from 'zustand';
import { Tender, Supplier } from '../types';
import { supabase } from '../lib/supabase';

interface TenderState {
  tenders: Tender[];
  fetchTenders: () => Promise<void>;
  addSupplier: (tenderId: string, supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (tenderId: string, supplierId: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (tenderId: string, supplierId: string) => Promise<void>;
  selectWinner: (tenderId: string, winnerId: string, winnerReason: string, reserveId?: string, reserveReason?: string) => Promise<void>;
  getTenderById: (tenderId: string) => Tender | undefined;
  deleteTender: (tenderId: string) => Promise<void>;
}

interface RawSupplier {
  id: string;
  company_name: string;
  contact_person: string;
  contact_number: string;
  delivery_time: number;
  price_per_unit: number;
  price: number;
  include_tax: boolean;
  proposal_url: string | null;
  created_by: string;
  created_at: string;
}

interface RawTender {
  id: string;
  request_id: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  winner_id: string | null;
  winner_reason: string | null;
  reserve_winner_id: string | null;
  reserve_winner_reason: string | null;
  suppliers?: RawSupplier[] | null;
}

export const useTenderStore = create<TenderState>((set, get) => ({
  tenders: [],

  getTenderById: (tenderId: string) => {
    return get().tenders.find(t => t.id === tenderId);
  },

  fetchTenders: async () => {
    try {
      // Fetch tenders with a simpler query first
      const { data: tendersData, error } = await supabase
        .from('tenders')
        .select(`
          id,
          request_id,
          status,
          created_at,
          updated_at,
          winner_id,
          winner_reason,
          reserve_winner_id,
          reserve_winner_reason
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenders:', error);
        throw error;
      }

      console.log('Tenders data:', tendersData);

      if (!tendersData) {
        console.log('No tenders found');
        set({ tenders: [] });
        return;
      }

      // Now fetch suppliers for each tender
      const tendersWithSuppliers = await Promise.all(
        tendersData.map(async (tender) => {
          const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .select(`
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
            `)
            .eq('tender_id', tender.id);

          if (suppliersError) {
            console.error(`Error fetching suppliers for tender ${tender.id}:`, suppliersError);
            return {
              ...tender,
              suppliers: []
            };
          }

          return {
            ...tender,
            suppliers: suppliers || []
          };
        })
      );

      console.log('Tenders with suppliers:', tendersWithSuppliers);

      const tenders = tendersWithSuppliers.map(tender => ({
        id: tender.id,
        requestId: tender.request_id,
        status: tender.status,
        createdAt: tender.created_at,
        updatedAt: tender.updated_at,
        winnerId: tender.winner_id,
        winnerReason: tender.winner_reason,
        reserveWinnerId: tender.reserve_winner_id,
        reserveWinnerReason: tender.reserve_winner_reason,
        suppliers: tender.suppliers?.map(s => ({
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
        }))
      }));

      console.log('Processed tenders:', tenders);
      set({ tenders });
    } catch (error) {
      console.error('Error in fetchTenders:', error);
      throw error;
    }
  },

  addSupplier: async (tenderId, supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          tender_id: tenderId,
          company_name: supplier.companyName,
          contact_person: supplier.contactPerson,
          contact_number: supplier.contactNumber,
          delivery_time: supplier.deliveryTime,
          price_per_unit: supplier.pricePerUnit,
          price: supplier.price,
          include_tax: supplier.includeTax,
          proposal_url: supplier.proposalUrl,
          created_by: supplier.createdBy,
          created_at: supplier.createdAt
        });

      if (error) throw error;

      await get().fetchTenders();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  },

  updateSupplier: async (tenderId, supplierId, updates) => {
    try {
      const updateData: any = {};
      
      if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
      if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
      if (updates.contactNumber !== undefined) updateData.contact_number = updates.contactNumber;
      if (updates.deliveryTime !== undefined) updateData.delivery_time = updates.deliveryTime;
      if (updates.pricePerUnit !== undefined) updateData.price_per_unit = updates.pricePerUnit;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.includeTax !== undefined) updateData.include_tax = updates.includeTax;
      if (updates.proposalUrl !== undefined) updateData.proposal_url = updates.proposalUrl;

      const { error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .eq('tender_id', tenderId);

      if (error) throw error;

      await get().fetchTenders();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  deleteSupplier: async (tenderId, supplierId) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
        .eq('tender_id', tenderId);

      if (error) throw error;

      await get().fetchTenders();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  selectWinner: async (tenderId: string, winnerId: string, winnerReason: string, reserveId?: string, reserveReason?: string) => {
    try {
      // Start a transaction
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .update({
          status: 'completed',
          winner_id: winnerId,
          winner_reason: winnerReason,
          reserve_winner_id: reserveId || null,
          reserve_winner_reason: reserveReason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenderId)
        .select()
        .single();

      if (tenderError) {
        console.error('Error updating tender:', tenderError);
        throw tenderError;
      }

      // Create protocol
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .insert({
          tender_id: tenderId,
          type: 'tender',
          status: 'pending',
          finance_status: 'not_submitted',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (protocolError) {
        console.error('Error creating protocol:', protocolError);
        throw protocolError;
      }

      // Refresh tenders
      await get().fetchTenders();
    } catch (error) {
      console.error('Error in selectWinner:', error);
      throw error;
    }
  },

  deleteTender: async (tenderId: string) => {
    try {
      // First delete all suppliers
      const { error: suppliersError } = await supabase
        .from('suppliers')
        .delete()
        .eq('tender_id', tenderId);

      if (suppliersError) throw suppliersError;

      // Then delete the tender
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        tenders: state.tenders.filter((t) => t.id !== tenderId),
      }));
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw error;
    }
  }
}));