import { supabase } from '../lib/supabase';

const BOT_TOKEN = '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: number | string, message: string) {
  try {
    const numericChatId = typeof chatId === 'string' ? parseInt(chatId) : chatId;
    
    if (isNaN(numericChatId)) {
      console.error('Invalid chat ID:', chatId);
      return;
    }

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: numericChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Unknown Telegram API error');
    }

    return data;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

export async function sendTelegramNotification(userIds: string[], message: string) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('telegram_chat_id')
      .in('id', userIds)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      throw error;
    }

    const sendPromises = (users || [])
      .filter(user => user.telegram_chat_id)
      .map(user => sendTelegramMessage(user.telegram_chat_id!, message));

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('Failed to send Telegram notifications:', error);
  }
}

export async function verifyTelegramChatId(phoneNumber: string): Promise<number | null> {
  try {
    // Clean the number but don't add prefix - trust the format we receive
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Add delay to ensure verification record is created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if verification exists
    const { data, error } = await supabase
      .from('telegram_verifications')
      .select('chat_id')
      .eq('phone_number', cleanNumber)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.chat_id || null;
  } catch (error) {
    console.error('Failed to verify Telegram chat ID:', error);
    return null;
  }
}

export function generateNotificationMessage(
  type: 'application' | 'application_approved' | 'application_rejected',
  companyName: string,
  additionalInfo?: { 
    reason?: string;
    login?: string;
    password?: string;
  }
): string {
  switch (type) {
    case 'application':
      return `Новая заявка на регистрацию от компании "${companyName}"`;
    case 'application_approved':
      return `Ваша заявка на регистрацию одобрена.\n\n` +
             `Данные для доступа в систему:\n` +
             `Логин: ${additionalInfo?.login || 'Не указан'}\n` +
             `Пароль: ${additionalInfo?.password || 'Не указан'}`;
    case 'application_rejected':
      return `Ваша заявка на регистрацию отклонена.${
        additionalInfo?.reason ? `\n\nПричина: ${additionalInfo.reason}` : ''
      }`;
    default:
      return '';
  }
}