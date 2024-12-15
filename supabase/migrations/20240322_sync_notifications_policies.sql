-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to update notifications_enabled" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update notifications_enabled" ON database_suppliers;

-- Create policy for users table
CREATE POLICY "Allow authenticated users to update notifications_enabled"
ON users
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for database_suppliers table
CREATE POLICY "Allow authenticated users to update notifications_enabled"
ON database_suppliers
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Log the policy creation
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'sync_notifications_policies',
    'Created RLS policies for notification sync',
    jsonb_build_object(
        'tables', ARRAY['users', 'database_suppliers'],
        'policy', 'Allow authenticated users to update notifications_enabled'
    )
); 