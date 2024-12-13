import { supabase } from '../lib/supabase';
import { sendTelegramMessage } from './telegram';

export async function notifyMatchingSuppliers(
  tenderId: string, 
  tenderName: string,
  categories: string[]
) {
  try {
    // Get all verified suppliers with matching categories and telegram chat IDs
    const { data: suppliers, error } = await supabase
      .from('database_suppliers')
      .select(`
        id,
        name,
        categories,
        telegram_chat_id
      `)
      .eq('status', 'verified')
      .eq('notifications_enabled', true)
      .not('telegram_chat_id', 'is', null);

    if (error) throw error;

    // Filter suppliers that have matching categories
    const matchingSuppliers = suppliers?.filter(supplier => 
      supplier.categories?.some(category => categories.includes(category))
    ) || [];

    // Send notifications to matching suppliers
    const notificationPromises = matchingSuppliers.map(supplier => {
      const message = `🔔 Новый тендер по вашей категории!\n\nНаименование: ${tenderName}\n\nВойдите в систему, чтобы принять участие в тендере.`;
      return sendTelegramMessage(supplier.telegram_chat_id!.toString(), message)
        .catch(error => {
          console.error(`Failed to send notification to supplier ${supplier.id}:`, error);
        });
    });

    await Promise.allSettled(notificationPromises);
    return matchingSuppliers.length;
  } catch (error) {
    console.error('Error notifying suppliers:', error);
    throw error;
  }
}