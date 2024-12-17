-- Update protocol completion notification message
CREATE OR REPLACE FUNCTION notify_protocol_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
    v_existing_notification UUID;
BEGIN
    -- Only proceed if protocol is being marked as completed
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get request name based on protocol type
        IF NEW.type = 'cash' THEN
            SELECT ri.name INTO v_request_name
            FROM protocols p
            LEFT JOIN requests r ON r.id = p.request_id
            LEFT JOIN request_items ri ON ri.request_id = r.id
            WHERE p.id = NEW.id
            LIMIT 1;
        ELSE
            SELECT ri.name INTO v_request_name
            FROM protocols p
            LEFT JOIN tenders t ON t.id = p.tender_id
            LEFT JOIN requests r ON r.id = t.request_id
            LEFT JOIN request_items ri ON ri.request_id = r.id
            WHERE p.id = NEW.id
            LIMIT 1;
        END IF;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO STRICT v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message with link
            v_message := format(
                '%s\n\nПерейти к архиву: https://apexflow.uz/archive?view=%s',
                CASE 
                    WHEN NEW.type = 'cash' THEN
                        format('Заявка на наличный расчет «%s» ожидает присвоения номера', COALESCE(v_request_name, 'Не указано'))
                    ELSE
                        format('Протокол «%s» ожидает присвоения номера', COALESCE(v_request_name, 'Не указано'))
                END,
                CASE 
                    WHEN NEW.type = 'cash' THEN 'cash'
                    ELSE 'protocols'
                END
            );

            -- Create notification
            INSERT INTO telegram_notifications (
                type,
                metadata,
                created_at,
                sent,
                error
            ) VALUES (
                'PROTOCOL_NEEDS_NUMBER',
                jsonb_build_object(
                    'type', NEW.type,
                    'name', v_request_name,
                    'message', v_message,
                    'chat_id', v_chat_id,
                    'protocolId', NEW.id,
                    'tenderId', NEW.tender_id,
                    'requestId', NEW.request_id
                ),
                NOW(),
                false,
                NULL
            );

            -- Process notifications immediately
            PERFORM process_telegram_notifications();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update cash request completion notification message
CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
    v_existing_notification UUID;
BEGIN
    -- Only proceed if status changed to 'protocol'
    IF NEW.status = 'protocol' AND (OLD.status IS NULL OR OLD.status != 'protocol') THEN
        -- Get request name
        SELECT name INTO v_request_name
        FROM request_items
        WHERE request_id = NEW.id
        ORDER BY created_at ASC
        LIMIT 1;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO STRICT v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message with link
            v_message := format(
                'Заявка на наличный расчет «%s» ожидает присвоения номера\n\nПерейти к архиву: https://apexflow.uz/archive?view=cash',
                COALESCE(v_request_name, 'Не указано')
            );

            -- Create notification
            INSERT INTO telegram_notifications (
                type,
                metadata,
                created_at,
                sent,
                error
            ) VALUES (
                'PROTOCOL_NEEDS_NUMBER',
                jsonb_build_object(
                    'type', 'cash',
                    'name', v_request_name,
                    'message', v_message,
                    'chat_id', v_chat_id,
                    'requestId', NEW.id
                ),
                NOW(),
                false,
                NULL
            );

            -- Process notifications immediately
            PERFORM process_telegram_notifications();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update new tender notification message
CREATE OR REPLACE FUNCTION notify_suppliers_of_new_tender()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_categories TEXT[];
    v_supplier RECORD;
BEGIN
    -- Get tender name from request_items
    SELECT ri.name INTO v_request_name
    FROM tenders t
    LEFT JOIN requests r ON r.id = t.request_id
    LEFT JOIN request_items ri ON ri.request_id = r.id
    WHERE t.id = NEW.id
    LIMIT 1;

    -- Get categories
    SELECT r.categories INTO v_categories
    FROM tenders t
    LEFT JOIN requests r ON r.id = t.request_id
    WHERE t.id = NEW.id;

    -- Notify matching suppliers
    FOR v_supplier IN
        SELECT ds.id, ds.telegram_chat_id
        FROM database_suppliers ds
        WHERE ds.status = 'verified'
        AND ds.notifications_enabled = true
        AND ds.telegram_chat_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM unnest(ds.categories) supplier_category
            WHERE supplier_category = ANY(v_categories)
        )
    LOOP
        -- Create notification with link
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
                    '🔔 Новый тендер по вашей категории!\n\nНаименование: %s\n\nПерейти к тендеру: https://apexflow.uz/tenders/%s',
                    COALESCE(v_request_name, 'Без названия'),
                    NEW.id
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 