-- Create a function to log notification toggle attempts
CREATE OR REPLACE FUNCTION log_notification_toggle_attempt()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log the toggle attempt
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notification_toggle',
        'Notification toggle attempt',
        jsonb_build_object(
            'supplier_id', NEW.id,
            'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.notifications_enabled ELSE NULL END,
            'new_value', NEW.notifications_enabled,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );

    RETURN NEW;
END;
$$;

-- Create trigger for logging toggle attempts
DROP TRIGGER IF EXISTS log_notification_toggle_attempt ON database_suppliers;
CREATE TRIGGER log_notification_toggle_attempt
    BEFORE UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_toggle_attempt();

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT EXECUTE ON FUNCTION log_notification_toggle_attempt() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'add_toggle_logging',
    'Added notification toggle logging',
    jsonb_build_object(
        'changes', ARRAY[
            'Created log_notification_toggle_attempt function',
            'Created logging trigger',
            'Granted permissions'
        ]
    )
); 