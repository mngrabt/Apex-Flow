-- First, ensure we have the right permissions
GRANT ALL ON TABLE tenders TO postgres;
GRANT ALL ON TABLE requests TO postgres;
GRANT ALL ON TABLE request_items TO postgres;
GRANT ALL ON TABLE users TO postgres;
GRANT ALL ON TABLE telegram_notifications TO postgres;
GRANT ALL ON TABLE debug_logs TO postgres;
GRANT ALL ON TABLE supplier_applications TO postgres;

-- Add RLS policies for supplier_applications
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON supplier_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON supplier_applications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON supplier_applications;

CREATE POLICY "Enable read access for authenticated users"
ON supplier_applications FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users"
ON supplier_applications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users"
ON supplier_applications FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE supplier_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS notify_suppliers_of_new_tender_trigger ON tenders;
DROP FUNCTION IF EXISTS notify_suppliers_of_new_tender CASCADE;

-- Create the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_suppliers_of_new_tender()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_request_name TEXT;
    v_categories TEXT[];
    v_supplier RECORD;
    v_matching_suppliers INTEGER := 0;
BEGIN
    -- Only proceed if this is a new tender or status changed to active
    IF NOT (
        (TG_OP = 'INSERT') OR 
        (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active')
    ) THEN
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_suppliers_of_new_tender',
            'Skipping - not a new active tender or status change to active',
            jsonb_build_object(
                'event_type', TG_OP,
                'tender_id', NEW.id,
                'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
                'new_status', NEW.status
            )
        );
        RETURN NEW;
    END IF;

    -- Get the tender request name and categories
    SELECT 
        ri.name,
        r.categories INTO v_request_name, v_categories
    FROM tenders t
    JOIN requests r ON r.id = t.request_id
    JOIN request_items ri ON ri.request_id = r.id
    WHERE t.id = NEW.id
    LIMIT 1;

    -- Early return if no categories found
    IF v_categories IS NULL OR array_length(v_categories, 1) IS NULL THEN
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_suppliers_of_new_tender',
            'No categories found for tender',
            jsonb_build_object(
                'tender_id', NEW.id,
                'request_id', NEW.request_id
            )
        );
        RETURN NEW;
    END IF;

    -- Find all supplier users whose categories overlap with the tender categories
    FOR v_supplier IN 
        SELECT 
            u.id,
            u.telegram_chat_id,
            u.categories as supplier_categories,
            u.username
        FROM users u
        WHERE u.role = 'S'  -- Supplier role
        AND u.telegram_chat_id IS NOT NULL
        AND u.categories IS NOT NULL
        AND array_length(u.categories, 1) > 0
        AND (u.categories && v_categories)  -- Array overlap operator
        AND u.notifications_enabled = true  -- Only check user notifications
    LOOP
        -- Log supplier match
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_suppliers_of_new_tender',
            'Found matching supplier',
            jsonb_build_object(
                'tender_id', NEW.id,
                'supplier_id', v_supplier.id,
                'supplier_username', v_supplier.username,
                'supplier_categories', v_supplier.supplier_categories,
                'tender_categories', v_categories,
                'telegram_chat_id', v_supplier.telegram_chat_id
            )
        );

        v_matching_suppliers := v_matching_suppliers + 1;

        -- Create notification for each matching supplier
        INSERT INTO telegram_notifications (
            type,
            metadata,
            created_at,
            sent,
            error
        ) VALUES (
            'NEW_TENDER',
            jsonb_build_object(
                'type', 'tender',
                'name', v_request_name,
                'message', format(
                    'Открыт новый тендер в вашей категории%s%s',
                    E'\n\n',
                    'Название: ' || COALESCE(v_request_name, 'Без названия')
                ),
                'chat_id', v_supplier.telegram_chat_id,
                'tenderId', NEW.id,
                'userId', v_supplier.id,
                'categories', v_categories
            ),
            NOW(),
            false,
            NULL
        );

        -- Process notification immediately
        PERFORM process_telegram_notifications();
    END LOOP;

    -- Log summary
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_suppliers_of_new_tender',
        'Completed supplier notifications',
        jsonb_build_object(
            'tender_id', NEW.id,
            'matching_suppliers', v_matching_suppliers,
            'tender_categories', v_categories
        )
    );

    RETURN NEW;
END;
$$;

-- Create the trigger with ALWAYS condition
CREATE TRIGGER notify_suppliers_of_new_tender_trigger
    AFTER INSERT OR UPDATE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION notify_suppliers_of_new_tender();

-- Force enable the trigger
ALTER TABLE tenders ENABLE ALWAYS TRIGGER notify_suppliers_of_new_tender_trigger;

-- Verify trigger status
DO $$
BEGIN
    INSERT INTO debug_logs (function_name, message, details)
    SELECT 
        'recreate_tender_trigger',
        'Verified trigger status',
        jsonb_build_object(
            'trigger_name', tgname,
            'enabled', CASE 
                WHEN tgenabled = 'O' THEN 'Disabled'
                WHEN tgenabled = 'D' THEN 'Disabled by session'
                WHEN tgenabled = 'R' THEN 'Replica'
                WHEN tgenabled = 'A' THEN 'Always'
                ELSE 'Unknown'
            END
        )
    FROM pg_trigger
    WHERE tgname = 'notify_suppliers_of_new_tender_trigger';
END $$; 