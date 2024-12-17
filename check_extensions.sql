-- Check if extensions are installed
SELECT 
    e.extname,
    e.extversion,
    e.extnamespace::regnamespace as schema,
    n.nspname as extension_schema,
    CASE 
        WHEN p.proname IS NOT NULL THEN true 
        ELSE false 
    END as has_http_function,
    CASE
        WHEN http_get('https://api.telegram.org/bot7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk/getMe') IS NOT NULL THEN true
        ELSE false
    END as can_make_http_request
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
LEFT JOIN pg_proc p ON p.proname = 'http' AND p.pronamespace = e.extnamespace
WHERE e.extname IN ('http', 'pg_net')
ORDER BY e.extname; 