-- Check the most recent debug logs for the tender notification process
SELECT 
    function_name,
    message,
    details,
    created_at
FROM debug_logs 
WHERE function_name = 'notify_suppliers_of_new_tender'
ORDER BY created_at DESC
LIMIT 5;

-- Check if notifications were created
SELECT 
    id,
    type,
    metadata,
    created_at,
    sent,
    error,
    retries
FROM telegram_notifications
WHERE type = 'NEW_TENDER'
ORDER BY created_at DESC
LIMIT 5;

-- Check the supplier's current state
SELECT 
    id,
    username,
    role,
    telegram_chat_id,
    categories
FROM users
WHERE role = 'S';

-- Check recent tenders with their full details
WITH recent_tenders AS (
    SELECT 
        t.id as tender_id,
        t.status as tender_status,
        t.created_at,
        r.id as request_id,
        r.categories as request_categories,
        ri.name as request_name
    FROM tenders t
    JOIN requests r ON r.id = t.request_id
    JOIN request_items ri ON ri.request_id = r.id
    ORDER BY t.created_at DESC
    LIMIT 5
)
SELECT 
    *,
    EXISTS (
        SELECT 1 
        FROM users u 
        WHERE u.role = 'S' 
        AND u.categories && recent_tenders.request_categories
    ) as has_matching_suppliers
FROM recent_tenders;

-- Check if the trigger exists and is active
SELECT 
    tgname as trigger_name,
    tgenabled as trigger_enabled,
    tgtype as trigger_type
FROM pg_trigger
WHERE tgname = 'notify_suppliers_of_new_tender_trigger'; 