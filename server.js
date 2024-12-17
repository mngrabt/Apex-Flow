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
const port = process.env.SUPPORT_BOT_PORT || 3002;

// Middleware
app.use(express.json());
app.use(cors());

// Environment variables
const BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN || '7576461454:AAEtP7m6G024u2IrR82_fAC3M3QDGXnUC8c';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ADMIN_CHAT_ID = '2041833916'; // Admin's chat ID

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let isPolling = false;
let offset = 0;
let server = null;

const WELCOME_MESSAGE = `Рады приветствовать вас в ApexFlow!

Расскажите, с чем мы можем помочь? Наши специалисты готовы приступить к решению вашего вопроса.`;

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
  console.log('[SUPPORT BOT] Sending message to chat ID:', chatId, 'Text:', text);
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

    if (!data.ok) {
      throw new Error(data.description || 'Unknown Telegram API error');
    }

    return data;
  } catch (error) {
    console.error('[SUPPORT BOT] Error sending message:', error);
    throw error;
  }
}

async function handleBotCommand(update) {
  console.log('[SUPPORT BOT] Processing update:', JSON.stringify(update, null, 2));
  
  const message = update.message;
  if (!message) {
    console.log('[SUPPORT BOT] No message in update');
    return;
  }

  const chatId = message.chat.id;
  console.log('[SUPPORT BOT] Processing message for chat ID:', chatId);

  // Check if message is from admin
  const isFromAdmin = chatId.toString() === ADMIN_CHAT_ID;

  // Handle /start command (only for non-admin users)
  if (message.text === '/start' && !isFromAdmin) {
    console.log('[SUPPORT BOT] Handling /start command');
    await sendTelegramMessage(chatId, WELCOME_MESSAGE);
    return;
  }

  // Handle messages from admin (only replies)
  if (isFromAdmin && message.reply_to_message) {
    // Extract user ID from the original forwarded message
    const originalMessage = message.reply_to_message.text;
    const userIdMatch = originalMessage.match(/ID: (\d+)/);
    
    if (userIdMatch) {
      const userId = userIdMatch[1];
      // Forward admin's reply to the user
      await sendTelegramMessage(userId, `${message.text}`);
      // Confirm to admin that message was sent
      await sendTelegramMessage(ADMIN_CHAT_ID, 'Сообщение доставлено получателю');
    } else {
      await sendTelegramMessage(ADMIN_CHAT_ID, 'Не получилось отправить ответ пользователю. Используйте функцию Reply к исходному сообщению.');
    }
    return;
  }

  // Handle regular messages from users (excluding admin)
  if (message.text && !isFromAdmin) {
    // Send acknowledgment to user
    await sendTelegramMessage(chatId, 'Мы получили ваше обращение и уже работаем над ним. Специалист поддержки свяжется с вами в ближайшее время.');
    
    // Forward to admin with user info
    const userInfo = [
      `Автор: ${message.from.first_name || 'Неизвестен'}`,
      message.from.username ? `@${message.from.username}` : null,
      `ID: ${message.from.id}`,
    ].filter(Boolean).join('\n');

    const adminMessage = `Поступило обращение в поддержку\n\n${userInfo}\n\nТекст обращения:\n${message.text}`;
    await sendTelegramMessage(ADMIN_CHAT_ID, adminMessage);
  }
}

async function startPolling() {
  if (isPolling) {
    console.log('[SUPPORT BOT] Already polling');
    return;
  }
  
  isPolling = true;
  console.log('[SUPPORT BOT] Starting polling...');

  // First, try to delete webhook to ensure we're the only instance
  try {
    const deleteWebhookResult = await makeRequest(`${TELEGRAM_API}/deleteWebhook`);
    console.log('[SUPPORT BOT] Deleted webhook:', deleteWebhookResult);
  } catch (error) {
    console.error('[SUPPORT BOT] Error deleting webhook:', error);
  }

  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const RECOVERY_DELAY = 5000; // 5 seconds

  while (isPolling) {
    try {
      console.log('[SUPPORT BOT] Polling for updates, offset:', offset);
      const data = await makeRequest(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);

      if (data.ok) {
        consecutiveErrors = 0; // Reset error counter on success
        const updates = data.result;
        if (updates.length > 0) {
          console.log(`[SUPPORT BOT] Received ${updates.length} updates`);

          for (const update of updates) {
            try {
              await handleBotCommand(update);
            } catch (error) {
              console.error('[SUPPORT BOT] Error handling update:', error);
            }
            offset = update.update_id + 1;
          }
        }
      } else {
        console.error('[SUPPORT BOT] GetUpdates error:', data);
        
        if (data.error_code === 409) {
          console.log('[SUPPORT BOT] Conflict detected, attempting to recover...');
          await makeRequest(`${TELEGRAM_API}/deleteWebhook`);
          await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
        }
        
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[SUPPORT BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
          isPolling = false;
          setTimeout(() => {
            isPolling = false;
            startPolling();
          }, RECOVERY_DELAY);
          break;
        }
      }
    } catch (error) {
      console.error('[SUPPORT BOT] Polling error:', error);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[SUPPORT BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
        isPolling = false;
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
  console.log('[SUPPORT BOT] Shutting down...');
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
  console.log(`Support bot server running on port ${port}`);
  startPolling().catch(error => {
    console.error('[SUPPORT BOT] Failed to start polling:', error);
    process.exit(1);
  });
}); 