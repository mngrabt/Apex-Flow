import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../services/notificationService';

interface Application {
  id: string;
  companyName: string;
  status: string;
  createdAt: string;
}

interface ApplicationStore {
  applications: Application[];
  fetchApplications: () => Promise<void>;
  createApplication: (application: Omit<Application, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  approveApplication: (applicationId: string, userId: string) => Promise<void>;
}

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  applications: [],

  fetchApplications: async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const applications = (data || []).map(app => ({
        id: app.id,
        companyName: app.company_name,
        status: app.status || 'pending',
        createdAt: app.created_at || new Date().toISOString()
      }));

      set({ applications });
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  createApplication: async (application) => {
    try {
      const { data, error } = await supabase
        .from('supplier_applications')
        .insert({
          company_name: application.companyName,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Notify Abdurauf about new application
      await sendNotification('NEW_APPLICATION', {
        companyName: application.companyName
      });

      await get().fetchApplications();
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  approveApplication: async (applicationId: string, userId: string) => {
    try {
      const application = get().applications.find(a => a.id === applicationId);
      if (!application) throw new Error('Application not found');

      const { error } = await supabase
        .from('supplier_applications')
        .update({ 
          status: 'approved',
          user_id: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Notify the applicant
      await sendNotification('APPLICATION_STATUS_CHANGED', {
        status: 'одобрена',
        companyName: application.companyName,
        supplierIds: [userId]
      });

      await get().fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  }
})); 