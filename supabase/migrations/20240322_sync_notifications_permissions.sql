-- Grant necessary permissions
GRANT ALL ON TABLE users TO postgres;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

GRANT ALL ON TABLE database_suppliers TO postgres;
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE database_suppliers TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION sync_notifications_settings() TO postgres;
GRANT EXECUTE ON FUNCTION sync_notifications_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications_settings() TO service_role;

GRANT EXECUTE ON FUNCTION sync_notifications_settings_from_users() TO postgres;
GRANT EXECUTE ON FUNCTION sync_notifications_settings_from_users() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications_settings_from_users() TO service_role;

-- Log the permission grants
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'sync_notifications_permissions',
    'Granted permissions for notification sync',
    jsonb_build_object(
        'tables', ARRAY['users', 'database_suppliers'],
        'functions', ARRAY['sync_notifications_settings', 'sync_notifications_settings_from_users'],
        'roles', ARRAY['postgres', 'authenticated', 'service_role']
    )
); 