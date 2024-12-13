import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  inn?: string;
  vatCertificateUrl?: string;
  licenseUrl?: string;
  passportUrl?: string;
  formUrl?: string;
  notificationsEnabled?: boolean;
  tenderCount?: number;
  wonTenderCount?: number;
}

interface SupplierStore {
  suppliers: Supplier[];
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  toggleNotifications: (id: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],

  fetchSuppliers: async () => {
    try {
      const { data, error } = await supabase
        .from('database_suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const suppliers = data.map(s => ({
        id: s.id,
        name: s.name,
        companyName: s.name,
        contactPerson: s.contact_person,
        email: s.email,
        phone: s.phone,
        categories: Array.isArray(s.categories) 
          ? s.categories 
          : s.category 
            ? [s.category]
            : [],
        status: s.status,
        createdAt: s.created_at,
        inn: s.inn,
        vatCertificateUrl: s.vat_certificate_url,
        licenseUrl: s.license_url,
        passportUrl: s.passport_url,
        formUrl: s.form_url,
        notificationsEnabled: s.notifications_enabled,
        tenderCount: s.tender_count,
        wonTenderCount: s.won_tender_count
      }));

      set({ suppliers });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  addSupplier: async (supplier) => {
    try {
      const { error } = await supabase
        .from('database_suppliers')
        .insert({
          name: supplier.companyName,
          category: supplier.categories[0],
          status: supplier.status,
          contact_person: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          inn: supplier.inn,
          vat_certificate_url: supplier.vatCertificateUrl,
          license_url: supplier.licenseUrl,
          passport_url: supplier.passportUrl,
          form_url: supplier.formUrl,
          notifications_enabled: supplier.notificationsEnabled
        });

      if (error) throw error;

      await get().fetchSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  },

  updateSupplier: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('database_suppliers')
        .update({
          name: updates.companyName,
          category: updates.categories ? updates.categories[0] : undefined,
          status: updates.status,
          contact_person: updates.contactPerson,
          phone: updates.phone,
          email: updates.email,
          inn: updates.inn,
          vat_certificate_url: updates.vatCertificateUrl,
          license_url: updates.licenseUrl,
          passport_url: updates.passportUrl,
          form_url: updates.formUrl,
          notifications_enabled: updates.notificationsEnabled
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  deleteSupplier: async (id) => {
    try {
      const { error } = await supabase
        .from('database_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  toggleNotifications: async (id) => {
    try {
      const supplier = get().suppliers.find(s => s.id === id);
      if (!supplier) return;

      const { error } = await supabase
        .from('database_suppliers')
        .update({
          notifications_enabled: !supplier.notificationsEnabled
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchSuppliers();
    } catch (error) {
      console.error('Error toggling notifications:', error);
      throw error;
    }
  }
}));