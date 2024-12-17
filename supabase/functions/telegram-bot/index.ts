import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const BOT_TOKEN = '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number };
    contact?: {
      phone_number: string;
      user_id: number;
    };
  };
}

// Create a single supabase client for interacting with your database
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function sendTelegramMessage(chatId: number, message: string, options: any = {}) {
  console.log('[BOT] Sending message to chat ID:', chatId, 'Message:', message);
  
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
}

async function handleContactShared(chatId: number, phoneNumber: string) {
  console.log('[BOT] Handling contact share for chat ID:', chatId, 'Phone:', phoneNumber);
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('998') ? cleanNumber : `998${cleanNumber}`;

  try {
    // Delete any existing verifications for this chat ID or phone number
    await supabase
      .from('telegram_verifications')
      .delete()
      .or(`chat_id.eq.${chatId},phone_number.eq.${formattedNumber}`);

    // Insert new verification
    const { error: insertError } = await supabase
      .from('telegram_verifications')
      .insert({
        chat_id: chatId,
        phone_number: formattedNumber,
        verified_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    await sendTelegramMessage(
      chatId,
      'Контактные данные получены. Вернитесь в приложение для продолжения процесса регистрации.',
      {
        reply_markup: { remove_keyboard: true }
      }
    );
  } catch (error) {
    console.error('[BOT] Error in verification process:', error);
    
    await sendTelegramMessage(
      chatId,
      'Не удалось выполнить верификацию. Повторите попытку.',
      {
        reply_markup: { remove_keyboard: true }
      }
    );
  }
}

async function handleBotCommand(update: any) {
  console.log('[BOT] Handling update:', JSON.stringify(update));
  
  const chatId = update.message?.chat?.id;
  const messageText = update.message?.text;

  if (!chatId) {
    console.log('[BOT] No chat ID found in update');
    return;
  }

  if (messageText === '/start') {
    console.log('[BOT] Sending welcome message');
    await sendTelegramMessage(
      chatId,
      'Добро пожаловать в систему ApexFlow!\n\nДля завершения регистрации нажмите кнопку «Поделиться контактом» ниже.',
      {
        reply_markup: {
          keyboard: [[{
            text: 'Поделиться контактом',
            request_contact: true
          }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
    return;
  }

  if (update.message?.contact) {
    console.log('[BOT] Contact received:', JSON.stringify(update.message.contact));
    const phoneNumber = update.message.contact.phone_number;
    const userId = update.message.from.id;
    
    if (userId === update.message.contact.user_id) {
      console.log('[BOT] Processing contact share');
      await sendTelegramMessage(chatId, 'Обработка...', {
        reply_markup: { remove_keyboard: true }
      });

      await handleContactShared(chatId, phoneNumber);
    } else {
      console.log('[BOT] Contact share rejected - user ID mismatch');
    }
  }
}

serve(async (req) => {
  try {
    if (req.method === 'POST') {
      const update = await req.json();
      await handleBotCommand(update);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return 405 for non-POST requests
    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('[BOT] Error handling request:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 