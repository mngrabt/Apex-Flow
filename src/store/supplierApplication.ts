import { create } from 'zustand';
import { SupplierApplication } from '../types';
import { supabase } from '../lib/supabase';
import { sendTelegramMessage } from '../services/telegram';
import { generateNotificationMessage } from '../services/telegram';
import { sendNotification } from '../services/notificationService';

interface SupplierApplicationState {
  applications: SupplierApplication[];
  fetchApplications: () => Promise<void>;
  submitApplication: (application: Omit<SupplierApplication, 'id' | 'status' | 'createdAt'> & {
    vatCertificate?: File;
    license?: File;
    passport?: File;
    form?: File;
  }) => Promise<void>;
  reviewApplication: (id: string, approved: boolean, notes: string, reviewerId: string) => Promise<void>;
}

export const useSupplierApplicationStore = create<SupplierApplicationState>((set, get) => ({
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
        contactPerson: app.contact_person,
        contactNumber: app.contact_number,
        telegramNumber: app.telegram_number,
        isTelegramSame: app.is_telegram_same,
        telegramChatId: app.telegram_chat_id,
        isVatPayer: app.is_vat_payer,
        vatCertificateUrl: app.vat_certificate_url,
        categories: Array.isArray(app.categories) ? app.categories : [],
        licenseUrl: app.license_url,
        passportUrl: app.passport_url,
        formUrl: app.form_url,
        email: app.email,
        inn: app.inn,
        status: app.status || 'pending',
        reviewNotes: app.review_notes,
        username: app.username,
        password: app.password,
        createdAt: app.created_at,
        reviewedAt: app.reviewed_at,
        reviewedBy: app.reviewed_by
      }));

      set({ applications });
    } catch (error) {
      console.error('Error in fetchApplications:', error);
      throw error;
    }
  },

  submitApplication: async (application) => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', application.username)
        .single();

      if (existingUser) {
        throw new Error('Это имя пользователя уже занято');
      }

      // Upload files if present
      const uploadFile = async (file: File | undefined, prefix: string) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `supplier_applications/${prefix}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        return publicUrl;
      };

      const [vatCertificateUrl, licenseUrl, passportUrl, formUrl] = await Promise.all([
        uploadFile(application.vatCertificate, 'vat'),
        uploadFile(application.license, 'license'),
        uploadFile(application.passport, 'passport'),
        uploadFile(application.form, 'form')
      ]);

      const { error } = await supabase
        .from('supplier_applications')
        .insert({
          company_name: application.companyName,
          contact_person: application.contactPerson,
          contact_number: application.contactNumber,
          telegram_number: application.telegramNumber,
          is_telegram_same: application.isTelegramSame,
          telegram_chat_id: application.telegramChatId,
          is_vat_payer: application.isVatPayer,
          vat_certificate_url: vatCertificateUrl,
          categories: application.categories,
          license_url: licenseUrl,
          passport_url: passportUrl,
          form_url: formUrl,
          email: application.email,
          inn: application.inn,
          username: application.username,
          password: application.password,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification to admins
      await sendNotification('NEW_APPLICATION', {
        companyName: application.companyName,
        userIds: [
          '00000000-0000-0000-0000-000000000001' // Abdurauf
        ]
      });

      await get().fetchApplications();
    } catch (error) {
      console.error('Error in submitApplication:', error);
      throw error;
    }
  },

  reviewApplication: async (id, approved, notes, reviewerId) => {
    try {
      const application = get().applications.find(a => a.id === id);
      if (!application) throw new Error('Application not found');

      if (approved) {
        // Use the secure function for approval which will create the user
        const { error: approvalError } = await supabase
          .rpc('approve_supplier_application', {
            application_id: id,
            reviewer_id: reviewerId
          });

        if (approvalError) throw approvalError;
      } else {
        // For rejection, just update the status
        const { error: updateError } = await supabase
          .from('supplier_applications')
          .update({
            status: 'rejected',
            review_notes: notes,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewerId
          })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      // Send notification to supplier
      if (application.telegramChatId) {
        const message = generateNotificationMessage(
          approved ? 'application_approved' : 'application_rejected',
          application.companyName,
          {
            reason: notes,
            username: approved ? application.username : undefined,
            password: approved ? application.password : undefined
          }
        );
        await sendTelegramMessage(application.telegramChatId.toString(), message);
      }

      await get().fetchApplications();
    } catch (error) {
      console.error('Error in reviewApplication:', error);
      throw error;
    }
  }
}));