-- Drop all existing notification-related triggers and functions
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;
DROP TRIGGER IF EXISTS handle_supplier_notification_toggle ON database_suppliers;
DROP FUNCTION IF EXISTS sync_notifications_toggle();
DROP FUNCTION IF EXISTS log_notification_toggle();
DROP FUNCTION IF EXISTS handle_notification_toggle();
DROP FUNCTION IF EXISTS toggle_supplier_notifications(bigint, boolean);

-- Drop existing policies
DROP POLICY IF EXISTS allow_update_notifications ON database_suppliers;

-- Create a simple policy to allow updating notifications_enabled
CREATE POLICY allow_update_notifications ON database_suppliers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE database_suppliers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;

-- Log the change
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'simplify_notification_toggle',
    'Simplified notification toggle permissions',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed all triggers and functions',
            'Added simple update policy',
            'Enabled RLS'
        ]
    )
); 