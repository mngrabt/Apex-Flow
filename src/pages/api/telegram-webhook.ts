import { handleWebhookUpdate } from '../../services/telegramWebhook';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[BOT] Received webhook request:', JSON.stringify(req.body));
    const success = await handleWebhookUpdate(req.body);
    
    if (success) {
      res.status(200).json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: 'Failed to process update' });
    }
  } catch (error) {
    console.error('[BOT] Webhook handler error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
} 