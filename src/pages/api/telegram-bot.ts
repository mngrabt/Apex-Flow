import type { NextApiRequest, NextApiResponse } from 'next';
import { handleBotCommand } from '../../services/telegramBot';

const BOT_TOKEN = '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let isPolling = false;
let currentOffset = 0;

async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;

  try {
    while (isPolling) {
      const response = await fetch(`${TELEGRAM_API}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: currentOffset,
          timeout: 30
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        console.log(`[BOT] Received ${data.result.length} updates`);
        
        for (const update of data.result) {
          try {
            await handleBotCommand(update);
          } catch (error) {
            console.error('[BOT] Error handling update:', error);
          }
          currentOffset = update.update_id + 1;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('[BOT] Polling error:', error);
    isPolling = false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Start polling
    if (!isPolling) {
      pollUpdates().catch(console.error);
    }
    res.status(200).json({ status: 'Polling started' });
  } else if (req.method === 'DELETE') {
    // Stop polling
    isPolling = false;
    res.status(200).json({ status: 'Polling stopped' });
  } else {
    // Get polling status
    res.status(200).json({ isPolling });
  }
} 