-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_notifications_settings_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_notifications_settings_from_users_trigger ON users;
DROP FUNCTION IF EXISTS sync_notifications_settings();
DROP FUNCTION IF EXISTS sync_notifications_settings_from_users();

-- Create a single function to handle notification sync
CREATE OR REPLACE FUNCTION sync_notifications()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if we're already inside a sync operation
    IF current_setting('app.syncing_notifications', TRUE) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Set the flag to prevent recursion
    PERFORM set_config('app.syncing_notifications', 'true', TRUE);

    BEGIN
        -- Log the sync attempt
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications',
            'Syncing notifications',
            jsonb_build_object(
                'source_table', TG_TABLE_NAME,
                'id', NEW.id,
                'new_value', NEW.notifications_enabled
            )
        );

        IF TG_TABLE_NAME = 'database_suppliers' THEN
            -- Update users table
            UPDATE users u
            SET notifications_enabled = NEW.notifications_enabled
            FROM database_suppliers ds
            WHERE ds.name = u.name
            AND ds.id = NEW.id
            AND u.role = 'S';
        ELSIF TG_TABLE_NAME = 'users' THEN
            -- Update database_suppliers table
            UPDATE database_suppliers ds
            SET notifications_enabled = NEW.notifications_enabled
            FROM users u
            WHERE ds.name = u.name
            AND u.id = NEW.id
            AND u.role = 'S';
        END IF;

        -- Reset the flag
        PERFORM set_config('app.syncing_notifications', 'false', TRUE);

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Reset the flag in case of error
        PERFORM set_config('app.syncing_notifications', 'false', TRUE);
        RAISE;
    END;
END;
$$;

-- Create triggers for both tables
CREATE TRIGGER sync_notifications_trigger
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications();

CREATE TRIGGER sync_notifications_trigger
    AFTER UPDATE OF notifications_enabled ON users
    FOR EACH ROW
    WHEN (NEW.role = 'S')
    EXECUTE FUNCTION sync_notifications();

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notification_recursion',
    'Updated notification sync system',
    jsonb_build_object(
        'changes', ARRAY[
            'Created single sync function with recursion prevention',
            'Added triggers on both tables',
            'Added session variable to prevent recursion'
        ]
    )
); 