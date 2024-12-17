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

// Environment variables for both bots
const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN || '7576461454:AAEtP7m6G024u2IrR82_fAC3M3QDGXnUC8c';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';

const SUPPORT_TELEGRAM_API = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}`;
const APEX_TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const ADMIN_CHAT_ID = '2041833916'; // Admin's chat ID

// Constants for error handling and recovery
const RECOVERY_DELAY = 5000; // 5 seconds delay for recovery
const MAX_CONSECUTIVE_ERRORS = 5;

// Separate polling states for each bot
let isSupportBotPolling = false;
let isApexBotPolling = false;
let supportBotOffset = 0;
let apexBotOffset = 0;

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function sendTelegramMessage(chatId, text, apiUrl, options = {}) {
  console.log(`[BOT] Sending message to chat ID: ${chatId}, Text: ${text}`);
  try {
    const data = await makeRequest(`${apiUrl}/sendMessage`, {
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
    console.error('[BOT] Error sending message:', error);
    throw error;
  }
}

async function handleSupportBotCommand(update) {
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
    await sendTelegramMessage(chatId, WELCOME_MESSAGE, SUPPORT_TELEGRAM_API);
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
      await sendTelegramMessage(userId, `${message.text}`, SUPPORT_TELEGRAM_API);
      // Confirm to admin that message was sent
      await sendTelegramMessage(ADMIN_CHAT_ID, 'Сообщение доставлено получателю', SUPPORT_TELEGRAM_API);
    } else {
      await sendTelegramMessage(ADMIN_CHAT_ID, 'Не получилось отправить ответ пользователю. Используйте функцию Reply к исходному сообщению.', SUPPORT_TELEGRAM_API);
    }
    return;
  }

  // Handle regular messages from users (excluding admin)
  if (message.text && !isFromAdmin) {
    // Send acknowledgment to user
    await sendTelegramMessage(chatId, 'Мы получили ваше обращение и уже работаем над ним. Специалист поддержки свяжется с вами в ближайшее время.', SUPPORT_TELEGRAM_API);
    
    // Forward to admin with user info
    const userInfo = [
      `Автор: ${message.from.first_name || 'Неизвестен'}`,
      message.from.username ? `@${message.from.username}` : null,
      `ID: ${message.from.id}`,
    ].filter(Boolean).join('\n');

    const adminMessage = `Поступило обращение в поддержку\n\n${userInfo}\n\nТекст обращения:\n${message.text}`;
    await sendTelegramMessage(ADMIN_CHAT_ID, adminMessage, SUPPORT_TELEGRAM_API);
  }
}

async function handleApexBotCommand(update) {
  console.log('[APEX BOT] Processing update:', JSON.stringify(update, null, 2));
  
  const message = update.message;
  if (!message) {
    console.log('[APEX BOT] No message in update');
    return;
  }

  const chatId = message.chat.id;
  console.log('[APEX BOT] Processing message for chat ID:', chatId);

  // Handle /start command
  if (message.text === '/start') {
    await sendTelegramMessage(chatId, 'Добро пожаловать в систему ApexFlow!\n\nДля завершения регистрации нажмите кнопку «Поделиться контактом» ниже.', APEX_TELEGRAM_API, {
      reply_markup: {
        keyboard: [[{ text: 'Поделиться контактом', request_contact: true }]],
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle contact sharing
  if (message.contact) {
    const phoneNumber = message.contact.phone_number;
    console.log('[APEX BOT] Received contact:', phoneNumber);
    
    try {
      // Clean and format the phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const formattedNumber = cleanNumber.startsWith('998') ? cleanNumber : `998${cleanNumber}`;
      
      // Delete any existing verifications for this number or chat ID
      await supabase
        .from('telegram_verifications')
        .delete()
        .or(`chat_id.eq.${chatId},phone_number.eq.${formattedNumber}`);

      // Store the new verification
      const { error: insertError } = await supabase
        .from('telegram_verifications')
        .insert({
          chat_id: chatId,
          phone_number: formattedNumber,
          verified_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Remove keyboard and confirm
      await sendTelegramMessage(chatId, 'Контактные данные получены. Вернитесь в приложение для продолжения процесса регистрации.', APEX_TELEGRAM_API, {
        reply_markup: {
          remove_keyboard: true
        }
      });
    } catch (error) {
      console.error('[APEX BOT] Error storing verification:', error);
      await sendTelegramMessage(chatId, 'Не удалось выполнить верификацию. Повторите попытку.', APEX_TELEGRAM_API, {
        reply_markup: {
          remove_keyboard: true
        }
      });
    }
    return;
  }
}

async function startSupportBotPolling() {
  if (isSupportBotPolling) {
    console.log('[SUPPORT BOT] Already polling');
    return;
  }
  
  isSupportBotPolling = true;
  console.log('[SUPPORT BOT] Starting polling...');
  let consecutiveErrors = 0;

  try {
    const deleteWebhookResult = await makeRequest(`${SUPPORT_TELEGRAM_API}/deleteWebhook`);
    console.log('[SUPPORT BOT] Deleted webhook:', deleteWebhookResult);
  } catch (error) {
    console.error('[SUPPORT BOT] Error deleting webhook:', error);
  }

  while (isSupportBotPolling) {
    try {
      const data = await makeRequest(`${SUPPORT_TELEGRAM_API}/getUpdates?offset=${supportBotOffset}&timeout=30`);

      if (data.ok) {
        consecutiveErrors = 0; // Reset error counter on success
        const updates = data.result;
        if (updates.length > 0) {
          console.log(`[SUPPORT BOT] Received ${updates.length} updates`);

          for (const update of updates) {
            try {
              await handleSupportBotCommand(update);
            } catch (error) {
              console.error('[SUPPORT BOT] Error handling update:', error);
            }
            supportBotOffset = update.update_id + 1;
          }
        }
      } else {
        console.error('[SUPPORT BOT] GetUpdates error:', data);
        
        if (data.error_code === 409) {
          console.log('[SUPPORT BOT] Conflict detected, attempting to recover...');
          await makeRequest(`${SUPPORT_TELEGRAM_API}/deleteWebhook`);
          await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
        }
        
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[SUPPORT BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
          isSupportBotPolling = false;
          setTimeout(() => startSupportBotPolling(), RECOVERY_DELAY);
          break;
        }
      }
    } catch (error) {
      console.error('[SUPPORT BOT] Polling error:', error);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[SUPPORT BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
        isSupportBotPolling = false;
        setTimeout(() => startSupportBotPolling(), RECOVERY_DELAY);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
    }
  }
}

async function startApexBotPolling() {
  if (isApexBotPolling) {
    console.log('[APEX BOT] Already polling');
    return;
  }
  
  isApexBotPolling = true;
  console.log('[APEX BOT] Starting polling...');
  let consecutiveErrors = 0;

  try {
    const deleteWebhookResult = await makeRequest(`${APEX_TELEGRAM_API}/deleteWebhook`);
    console.log('[APEX BOT] Deleted webhook:', deleteWebhookResult);
  } catch (error) {
    console.error('[APEX BOT] Error deleting webhook:', error);
  }

  while (isApexBotPolling) {
    try {
      const data = await makeRequest(`${APEX_TELEGRAM_API}/getUpdates?offset=${apexBotOffset}&timeout=30`);

      if (data.ok) {
        consecutiveErrors = 0; // Reset error counter on success
        const updates = data.result;
        if (updates.length > 0) {
          console.log(`[APEX BOT] Received ${updates.length} updates`);

          for (const update of updates) {
            try {
              await handleApexBotCommand(update);
            } catch (error) {
              console.error('[APEX BOT] Error handling update:', error);
            }
            apexBotOffset = update.update_id + 1;
          }
        }
      } else {
        console.error('[APEX BOT] GetUpdates error:', data);
        
        if (data.error_code === 409) {
          console.log('[APEX BOT] Conflict detected, attempting to recover...');
          await makeRequest(`${APEX_TELEGRAM_API}/deleteWebhook`);
          await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
        }
        
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[APEX BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
          isApexBotPolling = false;
          setTimeout(() => startApexBotPolling(), RECOVERY_DELAY);
          break;
        }
      }
    } catch (error) {
      console.error('[APEX BOT] Polling error:', error);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[APEX BOT] Too many consecutive errors (${consecutiveErrors}), restarting polling...`);
        isApexBotPolling = false;
        setTimeout(() => startApexBotPolling(), RECOVERY_DELAY);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
    }
  }
}

// Start both bots
startSupportBotPolling();
startApexBotPolling();

// Graceful shutdown
async function shutdown() {
  console.log('[SUPPORT BOT] Shutting down...');
  isSupportBotPolling = false;
  isApexBotPolling = false;
  
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
    isSupportBotPolling,
    isApexBotPolling,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start the server and bot
server = app.listen(port, () => {
  console.log(`Support bot server running on port ${port}`);
}); 