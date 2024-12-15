-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to update notifications_enabled" ON database_suppliers;
DROP POLICY IF EXISTS "Enable all access for all users" ON database_suppliers;
DROP POLICY IF EXISTS "Enable notification toggle for authenticated users" ON database_suppliers;
DROP POLICY IF EXISTS "allow_update_notifications" ON database_suppliers;

-- Create a single clear policy for updates
CREATE POLICY update_supplier_notifications ON database_suppliers
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create a policy for reading
CREATE POLICY read_suppliers ON database_suppliers
    FOR SELECT
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE database_suppliers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;

-- Log the change
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_supplier_policies',
    'Cleaned up database_suppliers policies',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed overlapping policies',
            'Created single update policy',
            'Added read policy',
            'Enabled RLS'
        ]
    )
); 