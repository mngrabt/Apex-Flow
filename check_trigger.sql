-- Check if trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgrelid::regclass as table_name,
    tgtype,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'notify_cash_request_completion_trigger';

-- Check if any debug logs were created by the trigger
SELECT 
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') as timestamp,
    message,
    jsonb_pretty(details) as details
FROM debug_logs 
WHERE 
    function_name = 'notify_cash_request_completion'
    AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check if the trigger function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'notify_cash_request_completion';

-- Check if the debug_logs table exists and has the right columns
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'debug_logs';

-- Check if the trigger is actually firing on status changes
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
    ) as trigger_fired
FROM requests r
WHERE 
    r.type = 'cash'
    AND r.status = 'protocol'
    AND r.created_at > NOW() - INTERVAL '1 hour'
ORDER BY r.created_at DESC; 