-- Create function to sync notifications settings
CREATE OR REPLACE FUNCTION sync_notifications_settings()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Find the corresponding user
    SELECT id INTO v_user_id
    FROM users u
    WHERE u.role = 'S'
    AND LOWER(TRIM(u.name)) = LOWER(TRIM(NEW.name));

    IF v_user_id IS NOT NULL THEN
        -- Update the user's notifications_enabled setting
        UPDATE users
        SET notifications_enabled = NEW.notifications_enabled
        WHERE id = v_user_id;

        -- Log the sync
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings',
            'Synced notifications settings',
            jsonb_build_object(
                'supplier_id', NEW.id,
                'user_id', v_user_id,
                'notifications_enabled', NEW.notifications_enabled
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for database_suppliers
DROP TRIGGER IF EXISTS sync_notifications_settings_trigger ON database_suppliers;
CREATE TRIGGER sync_notifications_settings_trigger
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_settings();

-- Create function to sync notifications settings from users
CREATE OR REPLACE FUNCTION sync_notifications_settings_from_users()
RETURNS TRIGGER AS $$
DECLARE
    v_supplier_id UUID;
BEGIN
    -- Find the corresponding supplier
    SELECT id INTO v_supplier_id
    FROM database_suppliers ds
    WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(NEW.name));

    IF v_supplier_id IS NOT NULL THEN
        -- Update the supplier's notifications_enabled setting
        UPDATE database_suppliers
        SET notifications_enabled = NEW.notifications_enabled
        WHERE id = v_supplier_id;

        -- Log the sync
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings_from_users',
            'Synced notifications settings from user',
            jsonb_build_object(
                'user_id', NEW.id,
                'supplier_id', v_supplier_id,
                'notifications_enabled', NEW.notifications_enabled
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users
DROP TRIGGER IF EXISTS sync_notifications_settings_from_users_trigger ON users;
CREATE TRIGGER sync_notifications_settings_from_users_trigger
    AFTER UPDATE OF notifications_enabled ON users
    FOR EACH ROW
    WHEN (NEW.role = 'S')
    EXECUTE FUNCTION sync_notifications_settings_from_users(); 