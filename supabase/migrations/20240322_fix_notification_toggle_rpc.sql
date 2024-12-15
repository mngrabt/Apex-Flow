-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
DROP TRIGGER IF EXISTS log_supplier_notification_toggle ON database_suppliers;
DROP TRIGGER IF EXISTS log_user_notification_toggle ON users;
DROP TRIGGER IF EXISTS handle_supplier_notification_toggle ON database_suppliers;
DROP FUNCTION IF EXISTS sync_notifications_toggle();
DROP FUNCTION IF EXISTS log_notification_toggle();
DROP FUNCTION IF EXISTS handle_notification_toggle();

-- Create a function to toggle notifications
CREATE OR REPLACE FUNCTION toggle_supplier_notifications(supplier_id bigint, enabled boolean)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_supplier_name text;
BEGIN
    -- Log the start of the operation
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'toggle_supplier_notifications',
        'Starting notification toggle',
        jsonb_build_object(
            'supplier_id', supplier_id,
            'enabled', enabled
        )
    );

    -- Update database_suppliers first
    UPDATE database_suppliers
    SET notifications_enabled = enabled
    WHERE id = supplier_id
    RETURNING name INTO v_supplier_name;

    -- Update corresponding user
    IF v_supplier_name IS NOT NULL THEN
        UPDATE users
        SET notifications_enabled = enabled
        WHERE name = v_supplier_name
        AND role = 'S';
    END IF;

    -- Log the completion
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'toggle_supplier_notifications',
        'Completed notification toggle',
        jsonb_build_object(
            'supplier_id', supplier_id,
            'supplier_name', v_supplier_name,
            'enabled', enabled,
            'success', true
        )
    );
END;
$$;

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_supplier_notifications(bigint, boolean) TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notification_toggle_rpc',
    'Created RPC function for notification toggle',
    jsonb_build_object(
        'changes', ARRAY[
            'Removed all triggers',
            'Created RPC function for direct updates',
            'Added proper logging'
        ]
    )
); 