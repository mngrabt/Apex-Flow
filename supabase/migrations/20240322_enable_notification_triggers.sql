-- Enable the notification toggle triggers
ALTER TABLE database_suppliers ENABLE TRIGGER log_supplier_notification_toggle;
ALTER TABLE users ENABLE TRIGGER log_user_notification_toggle;

-- Ensure the logging function has the right permissions
ALTER FUNCTION log_notification_toggle() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION log_notification_toggle() TO authenticated;

-- Grant insert permissions on debug_logs to the logging function
GRANT INSERT ON debug_logs TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'enable_notification_triggers',
    'Notification triggers enabled',
    jsonb_build_object(
        'triggers', ARRAY['log_supplier_notification_toggle', 'log_user_notification_toggle'],
        'actions', ARRAY[
            'Enabled triggers',
            'Updated function permissions',
            'Granted debug_logs access'
        ]
    )
); 