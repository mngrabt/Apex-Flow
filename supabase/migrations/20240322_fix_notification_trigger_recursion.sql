-- Drop existing triggers
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;

-- Create a function to sync notifications without recursion
CREATE OR REPLACE FUNCTION sync_notifications_toggle()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log the sync attempt
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications_toggle',
        'Syncing notifications between tables',
        jsonb_build_object(
            'source_table', TG_TABLE_NAME,
            'id', NEW.id,
            'new_value', NEW.notifications_enabled
        )
    );

    IF TG_TABLE_NAME = 'database_suppliers' THEN
        -- Update users table when database_suppliers is updated
        UPDATE users u
        SET notifications_enabled = NEW.notifications_enabled
        FROM database_suppliers ds
        WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(u.name))
        AND ds.id = NEW.id
        AND u.role = 'S';
    END IF;

    RETURN NEW;
END;
$$;

-- Create a function to log notification changes
CREATE OR REPLACE FUNCTION log_notification_toggle()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Create triggers with proper order
CREATE TRIGGER log_supplier_notification_toggle
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_toggle();

CREATE TRIGGER sync_supplier_notifications_trigger
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_toggle();

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications_toggle() TO authenticated;
GRANT EXECUTE ON FUNCTION log_notification_toggle() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notification_trigger_recursion',
    'Updated notification triggers',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed recursive triggers',
            'Added proper trigger order',
            'Updated sync logic to be one-way'
        ]
    )
); 