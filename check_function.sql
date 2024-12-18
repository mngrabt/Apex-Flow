-- Check function definition
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM 
    pg_proc 
WHERE 
    proname = 'notify_cash_request_completion'; 