-- Check if extensions are installed
SELECT 
    e.extname,
    e.extversion,
    e.extnamespace::regnamespace as schema,
    n.nspname as extension_schema,
    CASE 
        WHEN p.proname IS NOT NULL THEN true 
        ELSE false 
    END as has_http_function
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
LEFT JOIN pg_proc p ON p.proname = 'http' AND p.pronamespace = e.extnamespace
WHERE e.extname IN ('http', 'pg_net')
ORDER BY e.extname;

-- Check if we can make a test HTTP request
DO $$
BEGIN
    PERFORM http(
        'GET',
        'https://api.telegram.org/bot7832369613:AAGiV_Ct8Kd6MS6C-2WpRT6pJrawHetIw_U/getMe',
        ARRAY[('Content-Type', 'application/json')]::http_header[],
        'application/json',
        NULL
    );
    
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'check_http',
        'HTTP test successful',
        jsonb_build_object('test', 'getMe')
    );
EXCEPTION WHEN OTHERS THEN
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'check_http',
        'HTTP test failed',
        jsonb_build_object(
            'error', SQLERRM,
            'state', SQLSTATE
        )
    );
END $$; 