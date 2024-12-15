import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../services/notificationService';

export interface Application {
  id: string;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  categories: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: string;
}

interface ApplicationState {
  applications: Application[];
  fetchApplications: () => Promise<void>;
  createApplication: (application: Omit<Application, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  approveApplication: (applicationId: string, userId: string) => Promise<void>;
  rejectApplication: (applicationId: string, reason: string) => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],

  fetchApplications: async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ applications: data || [] });
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  createApplication: async (application) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...application,
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
        .from('applications')
        .update({ 
          status: 'approved',
          user_id: userId 
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
  },

  rejectApplication: async (applicationId: string, reason: string) => {
    try {
      const application = get().applications.find(a => a.id === applicationId);
      if (!application) throw new Error('Application not found');

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

      // Notify the applicant
      if (application.userId) {
        await sendNotification('APPLICATION_STATUS_CHANGED', {
          status: 'отклонена',
          companyName: application.companyName,
          reason,
          supplierIds: [application.userId]
        });
      }

      await get().fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  }
})); 