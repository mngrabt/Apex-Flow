-- Ensure notifications_enabled column exists in both tables
ALTER TABLE database_suppliers ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Create debug logging function for notification toggles
CREATE OR REPLACE FUNCTION log_notification_toggle()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'toggle_notifications',
        'Notification setting changed',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'id', NEW.id,
            'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.notifications_enabled ELSE NULL END,
            'new_value', NEW.notifications_enabled
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for logging notification toggles
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
CREATE TRIGGER log_supplier_notification_toggle
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_toggle();

DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;
CREATE TRIGGER log_user_notification_toggle
    AFTER UPDATE OF notifications_enabled ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_toggle();

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;

-- Enable RLS on both tables
ALTER TABLE database_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for notification toggling
DROP POLICY IF EXISTS "Enable notification toggle for authenticated users" ON database_suppliers;
CREATE POLICY "Enable notification toggle for authenticated users"
    ON database_suppliers
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable notification toggle for authenticated users" ON users;
CREATE POLICY "Enable notification toggle for authenticated users"
    ON users
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notifications_toggle',
    'Migration completed',
    jsonb_build_object(
        'tables', ARRAY['database_suppliers', 'users'],
        'actions', ARRAY[
            'Added notifications_enabled columns',
            'Created logging triggers',
            'Updated permissions',
            'Created RLS policies'
        ]
    )
); 