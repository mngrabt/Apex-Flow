-- Check debug logs for tender notifications
SELECT 
    function_name,
    message,
    details,
    created_at
FROM debug_logs 
WHERE function_name = 'notify_suppliers_of_new_tender'
ORDER BY created_at DESC
LIMIT 5;

-- Check if we have any supplier users with categories
SELECT 
    id,
    username,
    role,
    telegram_chat_id,
    categories
FROM users
WHERE role = 'S';

-- Check recent tenders and their categories
SELECT 
    t.id as tender_id,
    r.categories as request_categories,
    ri.name as request_name,
    t.created_at
FROM tenders t
JOIN requests r ON r.id = t.request_id
JOIN request_items ri ON ri.request_id = r.id
ORDER BY t.created_at DESC
LIMIT 5; 