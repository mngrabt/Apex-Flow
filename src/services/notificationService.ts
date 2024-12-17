import { sendTelegramNotification } from './telegram';
import { supabase } from '../lib/supabase';

// User IDs
const USER_IDS = {
  FOZIL: '00000000-0000-0000-0000-000000000003',
  AZIZ: '00000000-0000-0000-0000-000000000004',
  UMARALI: '00000000-0000-0000-0000-000000000005',
  DINARA: '00000000-0000-0000-0000-000000000006',
  UMAR: '00000000-0000-0000-0000-000000000007',
  AKMAL: '00000000-0000-0000-0000-000000000008',
  ABDURAUF: '00000000-0000-0000-0000-000000000001',
  SHERZOD: '00000000-0000-0000-0000-000000000009'
};

// Notification Types
export type NotificationType = 
  | 'REQUEST_NEEDS_SIGNATURE'
  | 'PROTOCOL_NEEDS_SIGNATURE'
  | 'NEW_TENDER'
  | 'TENDER_WINNER_SELECTED'
  | 'PROTOCOL_NEEDS_NUMBER'
  | 'PROTOCOL_GOT_NUMBER'
  | 'CASH_REQUEST_GOT_NUMBER'
  | 'SUPPLIER_ADDED_TO_TENDER'
  | 'SUPPLIER_REMOVED_FROM_TENDER'
  | 'SUPPLIER_UPDATED_IN_TENDER'
  | 'NEW_APPLICATION'
  | 'NEW_EVENT_SCHEDULED'
  | 'EVENT_NEEDS_SCHEDULING'
  | 'APPLICATION_STATUS_CHANGED'
  | 'PROTOCOL_SUBMITTED'
  | 'PROTOCOL_PAID'
  | 'NEW_TASK'
  | 'PROTOCOL_WAITING_OVERDUE'
  | 'PROTOCOL_NOT_SUBMITTED_OVERDUE'
  | 'EVENT_COMPLETED'
  | 'PROTOCOL_NUMBER_NEEDED';

// Add interface for NEW_TENDER notification data
interface NewTenderNotificationData {
  name: string;
  categories: string[];
  tenderId: string;
}

// Helper function to validate NEW_TENDER data
function validateNewTenderData(data: any): data is NewTenderNotificationData {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.name !== 'string') return false;
  if (!Array.isArray(data.categories)) return false;
  if (typeof data.tenderId !== 'string') return false;
  return true;
}

// Helper function to get notification recipients
function getNotificationRecipients(type: NotificationType, options?: any): string[] {
  switch (type) {
    case 'REQUEST_NEEDS_SIGNATURE':
      return [USER_IDS.FOZIL, USER_IDS.AZIZ];
    
    case 'PROTOCOL_NEEDS_SIGNATURE':
      return [USER_IDS.AZIZ, USER_IDS.FOZIL, USER_IDS.UMARALI];
    
    case 'NEW_TENDER':
      const recipients = options?.supplierIds || [];
      recipients.push(USER_IDS.FOZIL);
      return recipients;
    
    case 'TENDER_WINNER_SELECTED':
      return [USER_IDS.FOZIL];
    
    case 'PROTOCOL_NEEDS_NUMBER':
      return [USER_IDS.DINARA];
    
    case 'PROTOCOL_GOT_NUMBER':
    case 'CASH_REQUEST_GOT_NUMBER':
      return [USER_IDS.ABDURAUF, USER_IDS.UMARALI];
    
    case 'SUPPLIER_ADDED_TO_TENDER':
    case 'SUPPLIER_REMOVED_FROM_TENDER':
    case 'SUPPLIER_UPDATED_IN_TENDER':
      return [USER_IDS.ABDURAUF, USER_IDS.FOZIL];
    
    case 'NEW_APPLICATION':
      return [USER_IDS.ABDURAUF];
    
    case 'NEW_EVENT_SCHEDULED':
    case 'EVENT_COMPLETED':
      return [USER_IDS.UMAR, USER_IDS.AKMAL];
    
    case 'EVENT_NEEDS_SCHEDULING':
      return [USER_IDS.ABDURAUF];
    
    case 'APPLICATION_STATUS_CHANGED':
      return options?.supplierIds || [];
    
    case 'PROTOCOL_SUBMITTED':
      return [USER_IDS.SHERZOD];
    
    case 'PROTOCOL_PAID':
      return [USER_IDS.ABDURAUF];
    
    case 'NEW_TASK':
      return [USER_IDS.ABDURAUF];
    
    case 'PROTOCOL_WAITING_OVERDUE':
      return [USER_IDS.ABDURAUF, USER_IDS.SHERZOD];
    
    case 'PROTOCOL_NOT_SUBMITTED_OVERDUE':
      return [USER_IDS.ABDURAUF, USER_IDS.UMARALI];
    
    case 'PROTOCOL_NUMBER_NEEDED':
      return [USER_IDS.DINARA];
    
    default:
      return [];
  }
}

// Helper function to generate notification message
function generateNotificationMessage(type: NotificationType, data: any): string {
  switch (type) {
    case 'REQUEST_NEEDS_SIGNATURE':
      return `Заявка «${data.name}» ожидает вашей подписи\n\nhttps://apexflow.uz/requests`;
    
    case 'PROTOCOL_NEEDS_SIGNATURE':
      return `Протокол «${data.name}» ожидает вашей подписи\n\nhttps://apexflow.uz/protocols`;
    
    case 'NEW_TENDER':
      console.log('Generating NEW_TENDER notification with data:', data);
      return `Открыт новый тендер «${data.name}»\n\nhttps://apexflow.uz/tenders`;
    
    case 'TENDER_WINNER_SELECTED':
      return `В тендере «${data.tenderName}» определены победители:\nОсновной победитель: ${data.winnerName}${data.reserveName ? `\nРезервный победитель: ${data.reserveName}` : ''}`;
    
    case 'PROTOCOL_GOT_NUMBER':
      return `Протоколу «${data.name}» был присвоен номер «${data.number}» и он готов к отправке на оплату`;
    
    case 'CASH_REQUEST_GOT_NUMBER':
      return `Заявке на наличный расчет «${data.name}» был присвоен номер «${data.number}» и она готова к отправке на оплату`;
    
    case 'SUPPLIER_ADDED_TO_TENDER':
      return `Предложение от организации «${data.supplierName}» былы добавлено в тендер «${data.tenderName}»`;
    
    case 'SUPPLIER_REMOVED_FROM_TENDER':
      return `Участник «${data.supplierName}» был удален из тендера «${data.tenderName}»`;
    
    case 'SUPPLIER_UPDATED_IN_TENDER':
      return `Информация об участнике «${data.supplierName}» была изменена в тендере «${data.tenderName}»\nИзменено: ${data.updatedFields}`;
    
    case 'NEW_APPLICATION':
      return `Поступило новое заявление на регистрацию от организации «${data.companyName}»`;
    
    case 'NEW_EVENT_SCHEDULED':
      return `Объем «${data.title}» был запланирован на ${data.date}`;
    
    case 'APPLICATION_STATUS_CHANGED':
      return `Статус вашей заявки изменен на: ${data.status}\nОрганизация: ${data.companyName}`;
    
    case 'PROTOCOL_SUBMITTED':
      return `На оплату был подан новый протокол «${data.name}»`;
    
    case 'PROTOCOL_PAID':
      return `Объем «${data.name}» был оплачен и требует определения дедлайна`;
    
    case 'NEW_TASK':
      return `Была создана новая задача «${data.name}»`;
    
    case 'PROTOCOL_WAITING_OVERDUE':
      return `Протокол «${data.name}» находится в ожидание оплаты уже более 5 дней`;
    
    case 'PROTOCOL_NOT_SUBMITTED_OVERDUE':
      return `Протокол «${data.name}» находится в ожидание подачи на оплату уже более 2 дней`;
    
    case 'EVENT_COMPLETED':
      return `Объем «${data.title}» был выполнен`;
    
    case 'PROTOCOL_NUMBER_NEEDED':
      return data.type === 'cash' 
        ? `Заявка на наличный расчет «${data.name}» ожидает присвоения номера\n\nhttps://apexflow.uz/archive`
        : `Протокол «${data.name}» ожидает присвоения номера\n\nhttps://apexflow.uz/archive`;
    
    default:
      return '';
  }
}

// Main notification function
export async function sendNotification(type: NotificationType, data: any) {
  try {
    console.log('Raw notification data:', data);  // Add raw data logging

    // Validate NEW_TENDER data
    if (type === 'NEW_TENDER') {
      console.log('Validating NEW_TENDER data:', { ...data });  // Spread to see all properties
      if (!validateNewTenderData(data)) {
        console.error('Invalid NEW_TENDER notification data:', data);
        throw new Error(`Invalid NEW_TENDER notification data: missing required fields. Got: ${JSON.stringify(data)}`);
      }
    }

    const recipients = getNotificationRecipients(type, data);
    const message = generateNotificationMessage(type, data);
    
    console.log('Notification details:', {
      recipients,
      message,
      type,
      data
    });

    if (recipients.length > 0 && message) {
      await sendTelegramNotification(recipients, message);
      console.log('Notification sent successfully');
    } else {
      console.log('No notification sent:', {
        hasRecipients: recipients.length > 0,
        hasMessage: !!message
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

// Function to check for overdue protocols
export async function checkOverdueProtocols() {
  try {
    // Fetch protocols with their tender and request information to get titles
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        *,
        tender:tenders (
          request:requests (
            items:request_items (*)
          )
        )
      `)
      .or('finance_status.eq.waiting,finance_status.eq.not_submitted');

    if (error) throw error;

    const now = new Date();
    
    // Check waiting protocols (over 5 days)
    const waitingOverdue = protocols?.filter(protocol => {
      if (protocol.finance_status !== 'waiting' || !protocol.submitted_at || protocol.overdue_notified) return false;
      const waitingDays = (now.getTime() - new Date(protocol.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
      return waitingDays > 5;
    });

    // Check not submitted protocols (over 2 days)
    const notSubmittedOverdue = protocols?.filter(protocol => {
      if (protocol.finance_status !== 'not_submitted' || !protocol.created_at || protocol.overdue_notified) return false;
      const waitingDays = (now.getTime() - new Date(protocol.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return waitingDays > 2;
    });

    console.log('Checking overdue protocols:', {
      waitingCount: waitingOverdue?.length || 0,
      notSubmittedCount: notSubmittedOverdue?.length || 0,
      now,
      protocols: protocols?.map(p => ({
        id: p.id,
        status: p.finance_status,
        created: p.created_at,
        days: (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24),
        title: p.tender?.request?.items?.[0]?.name,
        notified: p.overdue_notified
      }))
    });

    // Send notifications for overdue protocols and mark them as notified
    for (const protocol of waitingOverdue || []) {
      const title = protocol.tender?.request?.items?.[0]?.name || `Протокол #${protocol.id}`;
      await sendNotification('PROTOCOL_WAITING_OVERDUE', {
        name: title
      });

      // Mark as notified
      await supabase
        .from('protocols')
        .update({ overdue_notified: true })
        .eq('id', protocol.id);
    }

    for (const protocol of notSubmittedOverdue || []) {
      const title = protocol.tender?.request?.items?.[0]?.name || `Протокол #${protocol.id}`;
      await sendNotification('PROTOCOL_NOT_SUBMITTED_OVERDUE', {
        name: title
      });

      // Mark as notified
      await supabase
        .from('protocols')
        .update({ overdue_notified: true })
        .eq('id', protocol.id);
    }
  } catch (error) {
    console.error('Failed to check overdue protocols:', error);
  }
} 