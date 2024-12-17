import { handleBotCommand } from './telegramBot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const BOT_USERNAME = '@ApexFlowBot';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: string, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BOT] Error sending message:', error);
    throw error;
  }
}