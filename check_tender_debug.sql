-- Check all recent debug logs for tender notifications with full details
SELECT 
    function_name,
    message,
    details,
    created_at
FROM debug_logs 
WHERE (function_name LIKE '%tender%' OR details::text LIKE '%tender%')
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check the current state of tenders
SELECT 
    t.id as tender_id,
    t.status as tender_status,
    t.created_at,
    r.id as request_id,
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
WHERE t.created_at > NOW() - INTERVAL '1 hour'
ORDER BY t.created_at DESC;

-- Check supplier configuration
SELECT 
    u.id,
    u.username,
    u.role,
    u.telegram_chat_id,
    u.categories,
    EXISTS (
        SELECT 1 
        FROM tenders t
        JOIN requests r ON r.id = t.request_id
        WHERE t.created_at > NOW() - INTERVAL '1 hour'
        AND r.categories && u.categories
    ) as has_matching_tenders
FROM users u
WHERE u.role = 'S';

-- Check notifications that were created
SELECT 
    tn.id,
    tn.type,
    tn.metadata,
    tn.created_at,
    tn.sent,
    tn.error,
    tn.retries,
    tn.processed_at
FROM telegram_notifications tn
WHERE tn.type = 'NEW_TENDER'
AND tn.created_at > NOW() - INTERVAL '1 hour'
ORDER BY tn.created_at DESC;

-- Check if trigger is properly enabled
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as trigger_enabled,
    t.tgtype as trigger_type,
    CASE 
        WHEN t.tgenabled = 'O' THEN 'Disabled'
        WHEN t.tgenabled = 'D' THEN 'Disabled by session'
        WHEN t.tgenabled = 'R' THEN 'Replica'
        WHEN t.tgenabled = 'A' THEN 'Always'
        ELSE 'Unknown'
    END as trigger_status,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'notify_suppliers_of_new_tender_trigger'; 