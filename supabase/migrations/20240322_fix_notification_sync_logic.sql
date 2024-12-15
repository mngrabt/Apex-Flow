-- Drop all existing notification sync triggers and functions
DROP TRIGGER IF EXISTS sync_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_notifications_trigger ON users;
DROP TRIGGER IF EXISTS sync_notifications_settings_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_notifications_settings_from_users_trigger ON users;
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;
DROP TRIGGER IF EXISTS handle_supplier_notification_toggle ON database_suppliers;
DROP FUNCTION IF EXISTS sync_notifications();
DROP FUNCTION IF EXISTS sync_notifications_settings();
DROP FUNCTION IF EXISTS sync_notifications_settings_from_users();
DROP FUNCTION IF EXISTS sync_notifications_toggle();
DROP FUNCTION IF EXISTS log_notification_toggle();
DROP FUNCTION IF EXISTS handle_notification_toggle();

-- Create a single function to handle notification sync
CREATE OR REPLACE FUNCTION sync_notifications()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_matched_rows INTEGER;
BEGIN
    -- Log the sync attempt
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications',
        'Starting notification sync',
        jsonb_build_object(
            'source_table', TG_TABLE_NAME,
            'id', NEW.id,
            'new_value', NEW.notifications_enabled,
            'operation', TG_OP
        )
    );

    IF TG_TABLE_NAME = 'database_suppliers' THEN
        -- Update users table
        WITH updated_rows AS (
            UPDATE users u
            SET notifications_enabled = NEW.notifications_enabled
            WHERE u.role = 'S'
            AND (
                -- Match by name
                LOWER(TRIM(u.name)) = LOWER(TRIM(NEW.name))
                OR
                -- Match by username
                LOWER(TRIM(u.username)) = LOWER(TRIM(NEW.name))
            )
            RETURNING u.id, u.name, u.username
        )
        SELECT COUNT(*) INTO v_matched_rows FROM updated_rows;

        -- Log the result
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications',
            'Supplier to User sync completed',
            jsonb_build_object(
                'supplier_id', NEW.id,
                'supplier_name', NEW.name,
                'matched_users', v_matched_rows,
                'new_value', NEW.notifications_enabled
            )
        );
    ELSIF TG_TABLE_NAME = 'users' AND NEW.role = 'S' THEN
        -- Update database_suppliers table
        WITH updated_rows AS (
            UPDATE database_suppliers ds
            SET notifications_enabled = NEW.notifications_enabled
            WHERE (
                -- Match by name
                LOWER(TRIM(ds.name)) = LOWER(TRIM(NEW.name))
                OR
                -- Match by username
                LOWER(TRIM(ds.name)) = LOWER(TRIM(NEW.username))
            )
            RETURNING ds.id, ds.name
        )
        SELECT COUNT(*) INTO v_matched_rows FROM updated_rows;

        -- Log the result
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications',
            'User to Supplier sync completed',
            jsonb_build_object(
                'user_id', NEW.id,
                'user_name', NEW.name,
                'user_username', NEW.username,
                'matched_suppliers', v_matched_rows,
                'new_value', NEW.notifications_enabled
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications',
        'Error in sync operation',
        jsonb_build_object(
            'error', SQLERRM,
            'source_table', TG_TABLE_NAME,
            'id', NEW.id
        )
    );
    RAISE;
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

-- Enable triggers with ALWAYS condition
ALTER TABLE database_suppliers ENABLE ALWAYS TRIGGER sync_notifications_trigger;
ALTER TABLE users ENABLE ALWAYS TRIGGER sync_notifications_trigger;

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notification_sync_logic',
    'Updated notification sync logic',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed all existing notification sync triggers and functions',
            'Created single sync function with improved logging',
            'Added flexible name/username matching',
            'Enabled triggers with ALWAYS condition'
        ]
    )
); 