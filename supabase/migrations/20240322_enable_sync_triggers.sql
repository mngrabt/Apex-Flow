-- Ensure notifications_enabled exists in database_suppliers
ALTER TABLE database_suppliers ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Add debug logging for initial state
INSERT INTO debug_logs (function_name, message, details)
SELECT 
    'sync_setup',
    'Current state of users and suppliers',
    jsonb_build_object(
        'user_id', u.id,
        'user_name', u.name,
        'user_notif', u.notifications_enabled,
        'matching_supplier', (
            SELECT jsonb_build_object(
                'id', ds.id,
                'name', ds.name,
                'notif', ds.notifications_enabled
            )
            FROM database_suppliers ds 
            WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(u.name))
            LIMIT 1
        )
    )
FROM users u 
WHERE u.role = 'S';

-- Drop and recreate functions with SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_notifications_settings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_user_id UUID;
    v_old_name TEXT;
    v_new_name TEXT;
BEGIN
    -- Log the trigger event
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications_settings',
        'Trigger fired',
        jsonb_build_object(
            'supplier_id', NEW.id,
            'old_name', CASE WHEN TG_OP = 'UPDATE' THEN OLD.name ELSE NULL END,
            'new_name', NEW.name,
            'old_notif', CASE WHEN TG_OP = 'UPDATE' THEN OLD.notifications_enabled ELSE NULL END,
            'new_notif', NEW.notifications_enabled
        )
    );

    -- Find the corresponding user
    SELECT id INTO v_user_id
    FROM users u
    WHERE u.role = 'S'
    AND LOWER(TRIM(u.name)) = LOWER(TRIM(NEW.name));

    IF v_user_id IS NOT NULL THEN
        -- Update the user's notifications_enabled setting
        UPDATE users
        SET notifications_enabled = NEW.notifications_enabled
        WHERE id = v_user_id
        AND notifications_enabled IS DISTINCT FROM NEW.notifications_enabled;

        -- Log the sync
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings',
            'Synced notifications settings',
            jsonb_build_object(
                'supplier_id', NEW.id,
                'user_id', v_user_id,
                'notifications_enabled', NEW.notifications_enabled,
                'supplier_name', NEW.name,
                'operation', TG_OP
            )
        );
    ELSE
        -- Log when no matching user is found
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings',
            'No matching user found for supplier',
            jsonb_build_object(
                'supplier_id', NEW.id,
                'supplier_name', NEW.name,
                'trimmed_name', LOWER(TRIM(NEW.name))
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_notifications_settings_from_users()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_supplier_id UUID;
BEGIN
    -- Log the trigger event
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'sync_notifications_settings_from_users',
        'Trigger fired',
        jsonb_build_object(
            'user_id', NEW.id,
            'role', NEW.role,
            'old_name', CASE WHEN TG_OP = 'UPDATE' THEN OLD.name ELSE NULL END,
            'new_name', NEW.name,
            'old_notif', CASE WHEN TG_OP = 'UPDATE' THEN OLD.notifications_enabled ELSE NULL END,
            'new_notif', NEW.notifications_enabled
        )
    );

    -- Only proceed if this is a supplier user
    IF NEW.role != 'S' THEN
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings_from_users',
            'Skipping non-supplier user',
            jsonb_build_object(
                'user_id', NEW.id,
                'role', NEW.role
            )
        );
        RETURN NEW;
    END IF;

    -- Find the corresponding supplier
    SELECT id INTO v_supplier_id
    FROM database_suppliers ds
    WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(NEW.name));

    IF v_supplier_id IS NOT NULL THEN
        -- Update the supplier's notifications_enabled setting
        UPDATE database_suppliers
        SET notifications_enabled = NEW.notifications_enabled
        WHERE id = v_supplier_id
        AND notifications_enabled IS DISTINCT FROM NEW.notifications_enabled;

        -- Log the sync
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings_from_users',
            'Synced notifications settings from user',
            jsonb_build_object(
                'user_id', NEW.id,
                'supplier_id', v_supplier_id,
                'notifications_enabled', NEW.notifications_enabled,
                'user_name', NEW.name,
                'operation', TG_OP
            )
        );
    ELSE
        -- Log when no matching supplier is found
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'sync_notifications_settings_from_users',
            'No matching supplier found for user',
            jsonb_build_object(
                'user_id', NEW.id,
                'user_name', NEW.name,
                'trimmed_name', LOWER(TRIM(NEW.name))
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS sync_notifications_settings_trigger ON database_suppliers;
DROP TRIGGER IF EXISTS sync_notifications_settings_from_users_trigger ON users;

-- Recreate triggers with ALWAYS condition
CREATE TRIGGER sync_notifications_settings_trigger
    AFTER UPDATE OF notifications_enabled ON database_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_settings();

CREATE TRIGGER sync_notifications_settings_from_users_trigger
    AFTER UPDATE OF notifications_enabled ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_notifications_settings_from_users();

-- Enable triggers with ALWAYS
ALTER TABLE database_suppliers ENABLE ALWAYS TRIGGER sync_notifications_settings_trigger;
ALTER TABLE users ENABLE ALWAYS TRIGGER sync_notifications_settings_from_users_trigger;

-- Log the trigger enablement and final state
INSERT INTO debug_logs (function_name, message, details)
SELECT 
    'enable_sync_triggers',
    'Final state after enabling triggers',
    jsonb_build_object(
        'user_id', u.id,
        'user_name', u.name,
        'user_notif', u.notifications_enabled,
        'matching_supplier', (
            SELECT jsonb_build_object(
                'id', ds.id,
                'name', ds.name,
                'notif', ds.notifications_enabled
            )
            FROM database_suppliers ds 
            WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(u.name))
            LIMIT 1
        )
    )
FROM users u 
WHERE u.role = 'S'; 