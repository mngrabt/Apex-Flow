-- Get all recent logs (last hour)
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    function_name,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Get error logs
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    function_name,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    (message ILIKE '%error%' OR message ILIKE '%fail%')
    AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check pending notifications
SELECT 
    id,
    type,
    metadata,
    error,
    retries,
    created_at,
    processed_at
FROM telegram_notifications
WHERE sent = false
ORDER BY created_at DESC; 

-- Check if Dinara's chat ID is set correctly
SELECT 
    id,
    telegram_chat_id,
    created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Get detailed send attempt logs with responses
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    CASE 
        WHEN message = 'Attempting to send message' THEN 
            jsonb_pretty(jsonb_build_object(
                'chat_id', details->>'chat_id',
                'message', details->>'message'
            ))
        WHEN message = 'Received response' THEN 
            jsonb_pretty(details->'response')
        WHEN message = 'Failed to send message' THEN
            jsonb_pretty(jsonb_build_object(
                'error', details->>'error',
                'response', details->'response'
            ))
        ELSE jsonb_pretty(details)
    END as details
FROM debug_logs 
WHERE 
    function_name = 'send_telegram_notification'
    AND created_at > NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC;

-- Check if extensions are enabled
SELECT 
    extname,
    extversion,
    extnamespace::regnamespace as extension_schema
FROM pg_extension
WHERE extname IN ('http', 'pg_net');

-- Get recent trigger logs
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    function_name,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    created_at > NOW() - INTERVAL '5 minutes'
    AND function_name = 'notify_cash_request_completion'
ORDER BY created_at DESC;

-- Check request status
SELECT 
    id,
    type,
    status,
    created_at
FROM requests
WHERE type = 'cash'
ORDER BY created_at DESC
LIMIT 5;

-- Check recent debug logs for the notification process
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    function_name,
    message,
    CASE 
        WHEN details IS NULL THEN NULL
        ELSE jsonb_pretty(details)
    END as details
FROM debug_logs 
WHERE 
    created_at > NOW() - INTERVAL '15 minutes'
    AND (
        function_name = 'notify_cash_request_completion'
        OR function_name = 'process_telegram_notifications'
        OR function_name = 'send_telegram_notification'
    )
ORDER BY created_at DESC;

-- Check notifications table
SELECT 
    id,
    type,
    jsonb_pretty(metadata) as metadata,
    created_at,
    sent,
    error,
    retries
FROM telegram_notifications
WHERE created_at > NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC;

-- Check Dinara's user record
SELECT 
    id,
    username,
    name,
    telegram_chat_id
FROM users
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Check recent request changes
SELECT 
    id,
    type,
    status,
    created_at
FROM requests
WHERE 
    type = 'cash'
    AND created_at > NOW() - INTERVAL '15 minutes'
ORDER BY created_at DESC;

-- Check if the trigger is firing at all
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    function_name = 'notify_cash_request_completion'
    AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check if any notifications were created
SELECT 
    id,
    type,
    jsonb_pretty(metadata) as metadata,
    created_at,
    sent,
    error,
    retries
FROM telegram_notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check Dinara's chat ID
SELECT 
    id,
    username,
    name,
    telegram_chat_id,
    role
FROM users
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgenabled as trigger_enabled,
    tgtype as trigger_type
FROM pg_trigger
WHERE tgname = 'notify_cash_request_completion_trigger';

-- Check if the function exists
SELECT 
    proname as function_name,
    provolatile as volatility,
    proisstrict as is_strict
FROM pg_proc
WHERE proname = 'notify_cash_request_completion';

-- Check recent cash requests that should have triggered notifications
SELECT 
    r.id,
    r.type,
    r.status,
    r.created_at,
    ri.name,
    ri.total_sum
FROM requests r
LEFT JOIN request_items ri ON ri.request_id = r.id
WHERE 
    r.type = 'cash'
    AND r.created_at > NOW() - INTERVAL '1 hour'
ORDER BY r.created_at DESC;

-- Check if the http extension is enabled and working
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('http', 'pg_net');

-- Check recent trigger firings
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    function_name = 'notify_cash_request_completion'
    AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Check notifications created
SELECT 
    id,
    type,
    sent,
    error,
    retries,
    created_at,
    jsonb_pretty(metadata) as metadata
FROM telegram_notifications
WHERE created_at > NOW() - INTERVAL '5 minutes'
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

-- Check send_telegram_notification logs
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    function_name = 'send_telegram_notification'
    AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Check if Dinara's chat ID is set
SELECT id, username, name, telegram_chat_id
FROM users
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Check recent cash requests that should have triggered notifications
SELECT 
    r.id,
    r.type,
    r.status,
    r.created_at,
    EXISTS (
        SELECT 1 
        FROM debug_logs d 
        WHERE d.function_name = 'notify_cash_request_completion'
        AND d.details->>'id' = r.id::text
        AND d.created_at > NOW() - INTERVAL '5 minutes'
    ) as trigger_fired
FROM requests r
WHERE 
    r.type = 'cash'
    AND r.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY r.created_at DESC;