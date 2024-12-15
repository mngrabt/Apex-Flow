-- Check all recent debug logs for tender notifications
SELECT 
    function_name,
    message,
    details,
    created_at
FROM debug_logs 
WHERE function_name LIKE '%tender%'
OR details::text LIKE '%tender%'
ORDER BY created_at DESC
LIMIT 10;

-- Check if any notifications were created
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

-- Check supplier configuration
SELECT 
    id,
    username,
    role,
    telegram_chat_id,
    categories
FROM users
WHERE role = 'S';

-- Check recent tenders and their status
SELECT 
    t.id as tender_id,
    t.status as tender_status,
    t.created_at,
    r.categories as request_categories,
    ri.name as request_name,
    EXISTS (
        SELECT 1 
        FROM users u 
        WHERE u.role = 'S' 
        AND u.categories && r.categories
    ) as has_matching_suppliers
FROM tenders t
JOIN requests r ON r.id = t.request_id
JOIN request_items ri ON ri.request_id = r.id
ORDER BY t.created_at DESC
LIMIT 5;

-- Check if trigger is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as trigger_enabled,
    tgtype as trigger_type,
    CASE 
        WHEN tgenabled = 'O' THEN 'Disabled'
        WHEN tgenabled = 'D' THEN 'Disabled by session'
        WHEN tgenabled = 'R' THEN 'Replica'
        WHEN tgenabled = 'A' THEN 'Always'
        ELSE 'Unknown'
    END as trigger_status
FROM pg_trigger
WHERE tgname = 'notify_suppliers_of_new_tender_trigger'; 