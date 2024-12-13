import { supabase } from '../lib/supabase';

const BOT_TOKEN = '7832369613:AAGiV_Ct8Kd6MS6C-2WpRT6pJrawHetIw_U';
const BOT_USERNAME = '@ApexFlowBot';
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
    // Clean and format phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('998') ? cleanNumber : `998${cleanNumber}`;

    // Add delay to ensure verification record is created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if verification exists
    const { data, error } = await supabase
      .from('telegram_verifications')
      .select('chat_id')
      .eq('phone_number', formattedNumber)
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
  type: 'application' | 'application_approved' | 'application_rejected' | 'tender',
  companyName: string,
  options?: { reason?: string; username?: string; password?: string }
) {
  switch (type) {
    case 'application_approved':
      return `🎉 Поздравляем! Ваша заявка на регистрацию компании "${companyName}" одобрена.

Данные для входа в систему:
👤 Логин: ${options?.username}
🔑 Пароль: ${options?.password}

Вы можете войти в систему по адресу: https://apexflow.uz/login

Добро пожаловать в ApexFlow!`;

    case 'application_rejected':
      return `❌ К сожалению, ваша заявка на регистрацию компании "${companyName}" отклонена.

Причина: ${options?.reason || 'Не указана'}

Если у вас есть вопросы, пожалуйста, свяжитесь с нами.`;

    case 'application':
      return `📝 Новая заявка на регистрацию от компании "${companyName}"`;

    case 'tender':
      return `🔔 Новый тендер создан. Пожалуйста, проверьте систему для получения подробной информации.`;

    default:
      return '';
  }
}