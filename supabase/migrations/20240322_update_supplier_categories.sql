-- Update test supplier's categories
UPDATE users
SET categories = ARRAY['Инструменты', 'Металлоконструкции']
WHERE username = 'test' AND role = 'S';

-- Log the update
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'update_supplier_categories',
    'Updated supplier categories',
    jsonb_build_object(
        'username', 'test',
        'new_categories', ARRAY['Инструменты', 'Металлоконструкции']::text[]
    )
); 