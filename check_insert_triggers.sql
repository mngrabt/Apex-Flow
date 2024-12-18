-- Check for INSERT triggers on requests
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'requests'
    AND event_manipulation = 'INSERT'
    AND trigger_schema = 'public'; 