-- Check for triggers on protocols table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'protocols'
    AND trigger_schema = 'public'; 