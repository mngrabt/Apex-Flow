-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;
DROP FUNCTION IF EXISTS sync_notifications_toggle();
DROP FUNCTION IF EXISTS log_notification_toggle();

-- Create a single function to handle notification toggle
CREATE OR REPLACE FUNCTION handle_notification_toggle()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if we're already inside a notification sync to prevent recursion
    IF current_setting('app.syncing_notifications', TRUE) = 'true' THEN
        RETURN NEW;
    END IF;

    -- Set the session variable to prevent recursion
    PERFORM set_config('app.syncing_notifications', 'true', TRUE);

    BEGIN
        -- Log the change
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'handle_notification_toggle',
            'Processing notification toggle',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'id', NEW.id,
                'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.notifications_enabled ELSE NULL END,
                'new_value', NEW.notifications_enabled
            )
        );

        -- Update the corresponding record in users table
        UPDATE users u
        SET notifications_enabled = NEW.notifications_enabled
        FROM database_suppliers ds
        WHERE ds.name = u.name
        AND ds.id = NEW.id
        AND u.role = 'S';

        -- Reset the session variable
        PERFORM set_config('app.syncing_notifications', 'false', TRUE);

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Reset the session variable in case of error
        PERFORM set_config('app.syncing_notifications', 'false', TRUE);
        RAISE;
    END;
END;
$$;

-- Create a single trigger for notification changes
CREATE TRIGGER handle_supplier_notification_toggle
    BEFORE UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_toggle();

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION handle_notification_toggle() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notification_toggle_depth',
    'Simplified notification toggle handling',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed multiple triggers',
            'Added session variable to prevent recursion',
            'Simplified to single trigger and function'
        ]
    )
); 