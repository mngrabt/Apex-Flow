-- Check if cash_requests is a table or view
SELECT 
    table_type,
    table_schema,
    table_name
FROM 
    information_schema.tables 
WHERE 
    table_name = 'cash_requests';

-- If it's a view, get its definition
SELECT 
    pg_get_viewdef('cash_requests'::regclass, true) as view_definition; 