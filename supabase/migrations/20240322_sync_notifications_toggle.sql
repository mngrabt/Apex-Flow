-- Create a function to sync notifications between tables
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
            'supplier_id', NEW.id,
            'new_value', NEW.notifications_enabled
        )
    );

    IF TG_TABLE_NAME = 'database_suppliers' THEN
        -- Update users table when database_suppliers is updated
        UPDATE users u
        SET notifications_enabled = NEW.notifications_enabled
        FROM database_suppliers ds
        WHERE LOWER(TRIM(u.username)) = LOWER(TRIM(ds.name))
        AND ds.id = NEW.id;
    ELSIF TG_TABLE_NAME = 'users' THEN
        -- Update database_suppliers table when users is updated
        UPDATE database_suppliers ds
        SET notifications_enabled = NEW.notifications_enabled
        FROM users u
        WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(u.username))
        AND u.id = NEW.id;
    END IF;

    -- Log the sync result
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications_toggle',
        'Completed notifications sync',
        jsonb_build_object(
            'source_table', TG_TABLE_NAME,
            'supplier_id', NEW.id,
            'new_value', NEW.notifications_enabled,
            'timestamp', NOW()
        )
    );

    RETURN NEW;
END;
$$;

-- Create triggers for syncing notifications
DROP TRIGGER IF EXISTS sync_supplier_notifications_trigger ON database_suppliers;
CREATE TRIGGER sync_supplier_notifications_trigger
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_toggle();

DROP TRIGGER IF EXISTS sync_user_notifications_trigger ON users;
CREATE TRIGGER sync_user_notifications_trigger
    AFTER UPDATE OF notifications_enabled ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_toggle();

-- Enable triggers
ALTER TABLE database_suppliers ENABLE TRIGGER sync_supplier_notifications_trigger;
ALTER TABLE users ENABLE TRIGGER sync_user_notifications_trigger;

-- Grant necessary permissions
GRANT ALL ON TABLE database_suppliers TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT EXECUTE ON FUNCTION sync_notifications_toggle() TO authenticated;

-- Log the migration completion
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'sync_notifications_migration',
    'Created notification sync triggers',
    jsonb_build_object(
        'changes', ARRAY[
            'Created sync_notifications_toggle function',
            'Created sync triggers for both tables',
            'Enabled triggers',
            'Granted permissions'
        ]
    )
); 