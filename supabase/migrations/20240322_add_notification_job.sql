-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if it exists
SELECT cron.unschedule('process-telegram-notifications');

-- Create a scheduled job to process notifications every minute
SELECT cron.schedule(
    'process-telegram-notifications',
    '* * * * *',  -- every minute
    $$
    INSERT INTO debug_logs (function_name, message)
    VALUES ('cron.process_notifications', 'Starting scheduled notification processing');
    
    SELECT process_telegram_notifications();
    
    INSERT INTO debug_logs (function_name, message)
    VALUES ('cron.process_notifications', 'Completed scheduled notification processing');
    $$
); 