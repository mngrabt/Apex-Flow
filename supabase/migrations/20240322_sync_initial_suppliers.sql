-- Insert missing suppliers from users table into database_suppliers
INSERT INTO database_suppliers (
    name,
    notifications_enabled,
    contact_person,
    phone,
    status,
    categories,
    created_at,
    email
)
SELECT 
    u.name,
    u.notifications_enabled,
    u.name as contact_person, -- Use name as contact person initially
    '' as phone, -- Empty string for phone
    'verified' as status,
    u.categories,
    NOW() as created_at,
    REPLACE(LOWER(TRIM(u.name)), ' ', '.') || '@example.com' as email -- Generate email from name
FROM users u
LEFT JOIN database_suppliers ds ON LOWER(TRIM(ds.name)) = LOWER(TRIM(u.name))
WHERE u.role = 'S'
AND ds.id IS NULL;

-- Log the sync results
INSERT INTO debug_logs (function_name, message, details)
SELECT 
    'sync_initial_suppliers',
    'Created missing supplier records',
    jsonb_build_object(
        'user_id', u.id,
        'user_name', u.name,
        'notifications_enabled', u.notifications_enabled,
        'categories', u.categories,
        'email', REPLACE(LOWER(TRIM(u.name)), ' ', '.') || '@example.com'
    )
FROM users u
LEFT JOIN database_suppliers ds ON LOWER(TRIM(ds.name)) = LOWER(TRIM(u.name))
WHERE u.role = 'S'
AND ds.id IS NULL; 