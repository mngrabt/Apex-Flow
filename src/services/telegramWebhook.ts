import { handleBotCommand } from './telegramBot';

const BOT_TOKEN = '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const BOT_USERNAME = '@ApexFlowBot';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let isPolling = false;
let currentOffset = 0;

// Start polling when this module is imported in a Node.js environment
if (typeof window === 'undefined') {
  startPolling().catch(console.error);
}

async function startPolling() {
  if (isPolling) return;
  
  console.log('[BOT] Starting polling...');
  isPolling = true;
  
  try {
    // First, delete any existing webhook
    const deleteResponse = await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=false`, {
      method: 'POST'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete webhook: ${deleteResponse.status}`);
    }

    // Start polling loop
    while (isPolling) {
      try {
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

        // Small delay between polls to prevent hammering the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('[BOT] Polling error:', error);
        // Wait a bit longer on error before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('[BOT] Fatal polling error:', error);
    isPolling = false;
  }
}

export function stopPolling() {
  isPolling = false;
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopPolling);
}