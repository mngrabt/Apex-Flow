-- Get the most recent request and trace its notification flow
WITH recent_request AS (
    SELECT id, created_at
    FROM requests 
    WHERE type = 'cash' AND status = 'protocol'
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    'Trigger Logs' as step,
    to_char(d.created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    d.message,
    jsonb_pretty(d.details) as details
FROM recent_request r
JOIN debug_logs d ON d.details->>'id' = r.id::text
WHERE d.function_name = 'notify_cash_request_completion'
UNION ALL
SELECT 
    'Notification Created' as step,
    to_char(n.created_at, 'YYYY-MM-DD HH24:MI:SS.MS'),
    n.type::text,
    jsonb_pretty(n.metadata)
FROM recent_request r
JOIN telegram_notifications n ON n.metadata->>'requestId' = r.id::text
UNION ALL
SELECT 
    'Process Notification Logs' as step,
    to_char(d.created_at, 'YYYY-MM-DD HH24:MI:SS.MS'),
    d.message,
    jsonb_pretty(d.details)
FROM recent_request r
JOIN telegram_notifications n ON n.metadata->>'requestId' = r.id::text
JOIN debug_logs d ON d.function_name = 'process_telegram_notifications'
    AND d.created_at >= r.created_at
UNION ALL
SELECT 
    'Send Attempt Logs' as step,
    to_char(d.created_at, 'YYYY-MM-DD HH24:MI:SS.MS'),
    d.message,
    jsonb_pretty(d.details)
FROM recent_request r
JOIN telegram_notifications n ON n.metadata->>'requestId' = r.id::text
JOIN debug_logs d ON d.function_name = 'send_telegram_notification'
    AND d.created_at >= r.created_at
ORDER BY timestamp; 