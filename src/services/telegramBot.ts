import { TelegramClient } from '../lib/telegram';
import { supabase } from '../lib/supabase';

const BOT_TOKEN = '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const client = new TelegramClient(BOT_TOKEN);

export async function handleBotCommand(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  console.log('[BOT] Processing message:', message);

  // Handle /start command
  if (message.text === '/start') {
    await client.sendMessage(chatId, 'Welcome to ApexFlow! Please share your contact to continue.', {
      reply_markup: {
        keyboard: [[{ text: 'Share Contact', request_contact: true }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle contact sharing
  if (message.contact) {
    const phoneNumber = message.contact.phone_number;
    console.log('[BOT] Received contact:', phoneNumber);
    
    try {
      // Clean the phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Delete any existing verifications for this number or chat ID
      await supabase
        .from('telegram_verifications')
        .delete()
        .or(`chat_id.eq.${chatId},phone_number.eq.${cleanNumber}`);

      // Store the new verification
      const { error: insertError } = await supabase
        .from('telegram_verifications')
        .insert({
          chat_id: chatId,
          phone_number: cleanNumber,
          verified_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Remove keyboard and confirm
      await client.sendMessage(chatId, 'Thank you! Your contact has been verified. You can now continue with registration.', {
        reply_markup: {
          remove_keyboard: true
        }
      });
    } catch (error) {
      console.error('[BOT] Error storing verification:', error);
      await client.sendMessage(chatId, 'Sorry, there was an error verifying your contact. Please try again later.', {
        reply_markup: {
          remove_keyboard: true
        }
      });
    }
    return;
  }

  // Default response for unknown commands
  await client.sendMessage(chatId, 'Sorry, I don\'t understand that command.');
}