import { supabase } from '../lib/supabase';

const BOT_TOKEN = '7832369613:AAGiV_Ct8Kd6MS6C-2WpRT6pJrawHetIw_U';
const BOT_USERNAME = '@ApexFlowBot';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let verificationPromises: { [key: string]: Promise<void> } = {};

export async function handleContactShared(chatId: number, phoneNumber: string) {
  try {
    const cleanNumber = (phoneNumber.startsWith('+998') ? phoneNumber : '+998' + phoneNumber).replace(/\D/g, '');
    
    console.log('[BOT] Contact shared:', {
      chatId,
      original: phoneNumber,
      cleaned: cleanNumber
    });

    verificationPromises[cleanNumber] = (async () => {
      try {
        const { error: deleteError } = await supabase
          .from('telegram_verifications')
          .delete()
          .eq('chat_id', chatId);

        if (deleteError) {
          console.error('[BOT] Error deleting verifications:', deleteError);
        }

        const { data, error } = await supabase
          .from('telegram_verifications')
          .insert({
            chat_id: chatId,
            phone_number: cleanNumber,
            verified_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('[BOT] Error inserting verification:', error);
          throw error;
        }

        console.log('[BOT] Successfully stored verification:', data);

        await sendTelegramMessage(
          chatId,
          'Контакт успешно сохранен. Вернитесь в приложение для продолжения регистрации.'
        );
      } catch (error) {
        console.error('[BOT] Verification error:', error);
        await sendTelegramMessage(
          chatId,
          'Произошла ошибка при сохранении контакта. Пожалуйста, попробуйте еще раз.'
        );
        throw error;
      }
    })();

    await verificationPromises[cleanNumber];
  } catch (error) {
    console.error('[BOT] Contact sharing error:', error);
  }
}

export async function verifyTelegramChatId(phoneNumber: string): Promise<number | null> {
  try {
    const cleanNumber = (phoneNumber.startsWith('+998') ? phoneNumber : '+998' + phoneNumber).replace(/\D/g, '');
    
    const { data: allVerifications, error: queryError } = await supabase
      .from('telegram_verifications')
      .select('*');

    if (queryError) {
      console.error('[VERIFY] Error fetching verifications:', queryError);
      throw queryError;
    }

    console.log('[VERIFY] Checking number:', {
      input: cleanNumber,
      allVerifications: allVerifications?.map(v => ({
        stored: v.phone_number
      }))
    });

    const match = allVerifications?.find(v => v.phone_number === cleanNumber);

    console.log('[VERIFY] Match result:', match);

    return match?.chat_id || null;
  } catch (error) {
    console.error('[VERIFY] Verification failed:', error);
    return null;
  }
}

async function sendTelegramMessage(chatId: number, message: string, options: any = {}) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        ...options
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
    throw error;
  }
}

export async function handleBotCommand(update: any) {
  try {
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text;

    if (!chatId) return;

    if (messageText === '/start') {
      await sendWelcomeMessage(chatId);
      return;
    }

    if (update.message?.contact) {
      const phoneNumber = update.message.contact.phone_number;
      const userId = update.message.from.id;
      
      if (userId === update.message.contact.user_id) {
        await handleContactShared(chatId, phoneNumber);
      }
      return;
    }
  } catch (error) {
    console.error('Error handling bot command:', error);
  }
}

async function sendWelcomeMessage(chatId: number) {
  const welcomeMessage = `
Добро пожаловать в ApexFlow!

Для продолжения регистрации, пожалуйста, поделитесь своим контактом используя кнопку ниже.
`;

  const keyboard = {
    keyboard: [
      [{
        text: 'Поделиться контактом',
        request_contact: true
      }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    persistent: true
  };

  try {
    await sendTelegramMessage(chatId, welcomeMessage, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error sending welcome message:', error);
    throw error;
  }
}