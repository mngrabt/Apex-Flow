import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Application {
  id: string;
  companyName: string;
  contactPerson: string;
  categories: string[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApplicationStore {
  applications: Application[] | null;
  fetchApplications: () => Promise<void>;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  applications: null,

  fetchApplications: async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const applications = data.map(app => ({
        id: app.id,
        companyName: app.company_name,
        contactPerson: app.contact_person,
        categories: app.categories || [],
        createdAt: app.created_at,
        status: app.status
      }));

      set({ applications });
    } catch (error) {
      console.error('Error fetching applications:', error);
      set({ applications: null });
    }
  }
})); 