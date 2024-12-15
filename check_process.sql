-- Check if the auto-process trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'auto_process_notifications';

-- Check if there are any unprocessed notifications
SELECT 
    id,
    type,
    created_at,
    processed_at,
    sent,
    error,
    retries,
    jsonb_pretty(metadata) as metadata
FROM telegram_notifications
WHERE sent = false
ORDER BY created_at DESC;

-- Check process_telegram_notifications logs
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    function_name = 'process_telegram_notifications'
    AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Check if the cron job is set up
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username
FROM cron.job
WHERE command LIKE '%process_telegram_notifications%';

-- Try to manually process notifications
SELECT process_telegram_notifications(); 