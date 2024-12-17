-- Drop existing function
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
BEGIN
    -- Get tender name and categories from request
    SELECT 
        ri.name,
        r.categories INTO v_request_name, v_categories
    FROM tenders t
    LEFT JOIN requests r ON r.id = t.request_id
    LEFT JOIN request_items ri ON ri.request_id = r.id
    WHERE t.id = NEW.id
    LIMIT 1;

    -- Early return if no categories found
    IF v_categories IS NULL OR array_length(v_categories, 1) IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find all supplier users whose categories overlap with the tender categories
    FOR v_supplier IN 
        SELECT 
            u.id,
            u.telegram_chat_id,
            u.categories as supplier_categories,
            u.username,
            u.notifications_enabled as user_notifications_enabled,
            ds.notifications_enabled as supplier_notifications_enabled
        FROM users u
        JOIN database_suppliers ds ON LOWER(TRIM(ds.name)) = LOWER(TRIM(u.username))
        WHERE u.role = 'S'  -- Supplier role
        AND u.telegram_chat_id IS NOT NULL
        AND u.categories IS NOT NULL
        AND array_length(u.categories, 1) > 0
        AND (u.categories && v_categories)  -- Array overlap operator
        AND u.notifications_enabled = true  -- Check user notifications
        AND ds.notifications_enabled = true  -- Check supplier notifications
    LOOP
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
                'tenderId', NEW.id::text,  -- Explicitly cast UUID to text
                'message', format(
                    '🔔 Новый тендер по вашей категории!\n\nНаименование: %s\n\nПерейти к тендеру: https://apexflow.uz/tenders/%s',
                    COALESCE(v_request_name, 'Без названия'),
                    NEW.id::text  -- Explicitly cast UUID to text
                ),
                'chat_id', v_supplier.telegram_chat_id,
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

    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER notify_suppliers_of_new_tender_trigger
    AFTER INSERT OR UPDATE ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION notify_suppliers_of_new_tender(); 