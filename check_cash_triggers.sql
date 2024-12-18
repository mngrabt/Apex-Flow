-- Check for triggers on cash_requests
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'cash_requests'
    AND trigger_schema = 'public'; 