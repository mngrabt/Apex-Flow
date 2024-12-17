import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let isPolling = false;
let offset = 0;
let server = null;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function sendTelegramMessage(chatId, text, options = {}) {
  console.log('[BOT] Sending message to chat ID:', chatId, 'Text:', text, 'Options:', options);
  try {
    const data = await makeRequest(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options
      })
    });

    console.log('[BOT] Send message response:', data);

    if (!data.ok) {
      throw new Error(data.description || 'Unknown Telegram API error');
    }

    return data;
  } catch (error) {
    console.error('[BOT] Error sending message:', error);
    throw error;
  }
}

async function handleContactShared(chatId, phoneNumber) {
  console.log('[BOT] Handling contact share for chat ID:', chatId, 'Phone:', phoneNumber);
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('998') ? cleanNumber : `998${cleanNumber}`;

  try {
    console.log('[BOT] Deleting existing verifications');
    // Delete any existing verifications
    const { error: deleteError } = await supabase
      .from('telegram_verifications')
      .delete()
      .or(`chat_id.eq.${chatId},phone_number.eq.${formattedNumber}`);

    if (deleteError) {
      console.error('[BOT] Error deleting verifications:', deleteError);
      throw deleteError;
    }

    console.log('[BOT] Inserting new verification');
    // Insert new verification
    const { error: insertError } = await supabase
      .from('telegram_verifications')
      .insert({
        chat_id: chatId,
        phone_number: formattedNumber,
        verified_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[BOT] Error inserting verification:', insertError);
      throw insertError;
    }

    console.log('[BOT] Sending confirmation message');
    await sendTelegramMessage(
      chatId,
      'Контактные данные получены. Вернитесь в приложение для продолжения процесса регистрации.',
      { reply_markup: { remove_keyboard: true } }
    );
  } catch (error) {
    console.error('[BOT] Error in verification process:', error);
    
    await sendTelegramMessage(
      chatId,
      'Не удалось выполнить верификацию. Повторите попытку.',
      { reply_markup: { remove_keyboard: true } }
    );
  }
}

async function handleBotCommand(update) {
  console.log('[BOT] Processing update:', JSON.stringify(update, null, 2));
  
  const message = update.message;
  if (!message) {
    console.log('[BOT] No message in update');
    return;
  }

  const chatId = message.chat.id;
  console.log('[BOT] Processing message for chat ID:', chatId);

  // Handle /start command
  if (message.text === '/start') {
    console.log('[BOT] Handling /start command');
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

  // Handle contact sharing
  if (message.contact) {
    console.log('[BOT] Received contact:', message.contact);
    const phoneNumber = message.contact.phone_number;
    const userId = message.from.id;
    
    if (userId === message.contact.user_id) {
      await handleContactShared(chatId, phoneNumber);
    } else {
      console.log('[BOT] Contact share rejected - user ID mismatch');
    }
  }
}

async function startPolling() {
  if (isPolling) {
    console.log('[BOT] Already polling');
    return;
  }
  
  isPolling = true;
  console.log('[BOT] Starting polling...');

  // First, try to delete webhook to ensure we're the only instance
  try {
    const deleteWebhookResult = await makeRequest(`${TELEGRAM_API}/deleteWebhook`);
    console.log('[BOT] Deleted webhook:', deleteWebhookResult);
  } catch (error) {
    console.error('[BOT] Error deleting webhook:', error);
  }

  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const RECOVERY_DELAY = 5000; // 5 seconds

  while (isPolling) {
    try {
      console.log('[BOT] Polling for updates, offset:', offset);
      const data = await makeRequest(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);

      if (data.ok) {
        consecutiveErrors = 0; // Reset error counter on success
        const updates = data.result;
        if (updates.length > 0) {
          console.log(`[BOT] Received ${updates.length} updates`);

          for (const update of updates) {
            try {
              await handleBotCommand(update);
            } catch (error) {
              console.error('[BOT] Error handling update:', error);
            }
            offset = update.update_id + 1;
          }
        }
      } else {
        console.error('[BOT] GetUpdates error:', data);
        
        if (data.error_code === 409) {
          console.log('[BOT] Conflict detected, attempting to recover...');
          // On conflict, try to delete webhook and wait before retrying
          await makeRequest(`${TELEGRAM_API}/deleteWebhook`);
          await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
        }
        
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
          isPolling = false;
          // Wait and restart polling
          setTimeout(() => {
            isPolling = false;
            startPolling();
          }, RECOVERY_DELAY);
          break;
        }
      }
    } catch (error) {
      console.error('[BOT] Polling error:', error);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
        isPolling = false;
        // Wait and restart polling
        setTimeout(() => {
          isPolling = false;
          startPolling();
        }, RECOVERY_DELAY);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
    }
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('[BOT] Shutting down...');
  isPolling = false;
  
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
  
  process.exit(0);
}

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    isPolling,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start the server and bot
server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startPolling().catch(error => {
    console.error('[BOT] Failed to start polling:', error);
    process.exit(1);
  });
}); 