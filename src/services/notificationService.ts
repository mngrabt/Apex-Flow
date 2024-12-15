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
      return [USER_IDS.UMARALI];
    
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
      return `🖋 Новая заявка требует вашей подписи:\n${data.name}`;
    
    case 'PROTOCOL_NEEDS_SIGNATURE':
      return `🖋 Новый протокол требует вашей подписи:\n${data.name}`;
    
    case 'NEW_TENDER':
      return `🔔 Новый тендер:\n${data.name}`;
    
    case 'TENDER_WINNER_SELECTED':
      return `🏆 Выбран победитель тендера:\n${data.tenderName}\nПобедитель: ${data.winnerName}${data.reserveName ? `\nРезерв: ${data.reserveName}` : ''}`;
    
    case 'PROTOCOL_NEEDS_NUMBER':
      return `📝 ${data.type === 'cash' ? 'Кассовый протокол' : 'Протокол'} из отдела ${data.department} ожидает присвоения номера${data.requestNumber ? `\nНомер заявки: ${data.requestNumber}` : ''}`;
    
    case 'PROTOCOL_GOT_NUMBER':
      return `✅ Протоколу присвоен номер и он готов к подаче:\n${data.name}\nНомер: ${data.number}`;
    
    case 'SUPPLIER_ADDED_TO_TENDER':
      return `➕ Новый поставщик добавлен в тендер:\n${data.supplierName}\nТендер: ${data.tenderName}`;
    
    case 'SUPPLIER_REMOVED_FROM_TENDER':
      return `➖ Поставщик удален из тендера:\n${data.supplierName}\nТендер: ${data.tenderName}`;
    
    case 'SUPPLIER_UPDATED_IN_TENDER':
      return `✏️ Поставщик изменен в тендере:\n${data.supplierName}\nТендер: ${data.tenderName}\nИзменено: ${data.updatedFields}`;
    
    case 'NEW_APPLICATION':
      return `📋 Новая заява на регистрацию от компании:\n${data.companyName}`;
    
    case 'NEW_EVENT_SCHEDULED':
      return `📅 Новое событие запланировано:\n${data.title}\nДата: ${data.date}`;
    
    case 'EVENT_NEEDS_SCHEDULING':
      return `⚠️ Новое событие требует планиро��ания:\n${data.title}`;
    
    case 'APPLICATION_STATUS_CHANGED':
      return `ℹ️ Статус вашей заявки изменен на: ${data.status}\nКомпания: ${data.companyName}`;
    
    case 'PROTOCOL_SUBMITTED':
      return `📨 Новый протокол подан в финансовый отдел:\n${data.name}`;
    
    case 'PROTOCOL_PAID':
      return `💰 Протокол отмечен как оплаченный:\n${data.name}`;
    
    case 'NEW_TASK':
      return `📋 Новая задача создана:\n${data.name}`;
    
    case 'PROTOCOL_WAITING_OVERDUE':
      return `⚠️ Протокол ожидает оплату более 5 дней:\n${data.name}`;
    
    case 'PROTOCOL_NOT_SUBMITTED_OVERDUE':
      return `⚠️ Протокол не подан более 2 дней:\n${data.name}`;
    
    case 'EVENT_COMPLETED':
      return `✅ Событие отмечено как выполненное:\n${data.title}`;
    
    case 'PROTOCOL_NUMBER_NEEDED':
      return `📝 ${data.type === 'cash' ? 'Кассовый протокол' : 'Протокол'} из отдела ${data.department} ожидает присвоения номера${data.requestNumber ? `\nНомер заявки: ${data.requestNumber}` : ''}`;
    
    default:
      return '';
  }
}

// Main notification function
export async function sendNotification(type: NotificationType, data: any) {
  try {
    console.log('Sending notification:', { type, data });

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
    throw error; // Re-throw to handle in the calling function
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