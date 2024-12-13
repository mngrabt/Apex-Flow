import { handleBotCommand } from './telegramBot';

const BOT_TOKEN = '7832369613:AAGiV_Ct8Kd6MS6C-2WpRT6pJrawHetIw_U';
const BOT_USERNAME = '@ApexFlowBot';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let isPolling = false;
let currentOffset = 0;
let pollController: AbortController | null = null;

export async function setupWebhook() {
  try {
    // Stop any existing polling
    stopPolling();

    // Delete existing webhook first
    const deleteResponse = await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`, {
      method: 'POST'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete webhook: ${deleteResponse.statusText}`);
    }

    // Wait a moment for webhook deletion to take effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start polling if not already running
    if (!isPolling) {
      isPolling = true;
      pollController = new AbortController();
      await startPolling();
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    isPolling = false;
    // Try to recover by deleting webhook again
    try {
      await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`, {
        method: 'POST'
      });
    } catch (e) {
      console.error('Failed to recover from webhook error:', e);
    }
  }
}

async function startPolling() {
  while (isPolling) {
    try {
      if (!pollController) {
        pollController = new AbortController();
      }

      // First check if there's any webhook set
      const webhookInfo = await fetch(`${TELEGRAM_API}/getWebhookInfo`, {
        method: 'POST'
      });
      
      const webhookData = await webhookInfo.json();
      
      // If webhook is still set, try to delete it
      if (webhookData.ok && webhookData.result.url) {
        await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`, {
          method: 'POST'
        });
        // Wait a moment for webhook deletion to take effect
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await fetch(`${TELEGRAM_API}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: currentOffset,
          timeout: 30,
          allowed_updates: ['message']
        }),
        signal: pollController.signal
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Webhook conflict detected, try to delete webhook again
          await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`, {
            method: 'POST'
          });
          // Wait a moment and continue
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          await handleBotCommand(update);
          currentOffset = update.update_id + 1;
        }
      }

      // Add small delay between polls
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        break;
      }
      console.error('Polling error:', error);
      // Add longer delay on error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

export function stopPolling() {
  isPolling = false;
  currentOffset = 0;
  
  if (pollController) {
    pollController.abort();
    pollController = null;
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  stopPolling();
});