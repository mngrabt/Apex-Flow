-- Update the name in database_suppliers to match users
UPDATE database_suppliers ds
SET name = u.name
FROM users u
WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(SPLIT_PART(u.name, ' ', 1)))
AND u.role = 'S';

-- Log the name sync
INSERT INTO debug_logs (function_name, message, details)
SELECT 
    'fix_supplier_name_sync',
    'Updated supplier names to match user names',
    jsonb_build_object(
        'supplier_id', ds.id,
        'old_name', ds.name,
        'new_name', u.name,
        'user_id', u.id
    )
FROM database_suppliers ds
JOIN users u ON LOWER(TRIM(ds.name)) = LOWER(TRIM(SPLIT_PART(u.name, ' ', 1)))
WHERE u.role = 'S';

-- Update the trigger function to handle spaces in names
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
    -- Only proceed if this is a new active tender or status changing to active
    IF NOT (
        (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
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

    -- Log the tender details
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_suppliers_of_new_tender',
        'Processing active tender',
        jsonb_build_object(
            'tender_id', NEW.id,
            'name', v_request_name,
            'categories', v_categories,
            'request_id', NEW.request_id,
            'status', NEW.status
        )
    );

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
    -- and have notifications enabled in BOTH tables
    FOR v_supplier IN 
        SELECT 
            u.id,
            u.telegram_chat_id,
            u.categories as supplier_categories,
            u.name as supplier_name,
            u.notifications_enabled as user_notifications_enabled,
            ds.notifications_enabled as supplier_notifications_enabled
        FROM users u
        JOIN database_suppliers ds ON ds.name = u.name  -- Exact match now that names are synced
        WHERE u.role = 'S'  -- Supplier role
        AND u.telegram_chat_id IS NOT NULL
        AND u.categories IS NOT NULL
        AND array_length(u.categories, 1) > 0
        AND (u.categories && v_categories)  -- Array overlap operator
        AND u.notifications_enabled = true  -- Check user notifications
        AND ds.notifications_enabled = true  -- Check supplier notifications
    LOOP
        -- Log supplier match
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_suppliers_of_new_tender',
            'Found matching supplier with notifications enabled',
            jsonb_build_object(
                'tender_id', NEW.id,
                'supplier_id', v_supplier.id,
                'supplier_name', v_supplier.supplier_name,
                'supplier_categories', v_supplier.supplier_categories,
                'tender_categories', v_categories,
                'telegram_chat_id', v_supplier.telegram_chat_id,
                'user_notifications_enabled', v_supplier.user_notifications_enabled,
                'supplier_notifications_enabled', v_supplier.supplier_notifications_enabled
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
                    '🔔 Новый тендер в вашей категории%s%s',
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
            'tender_categories', v_categories,
            'status', NEW.status
        )
    );

    RETURN NEW;
END;
$$; 