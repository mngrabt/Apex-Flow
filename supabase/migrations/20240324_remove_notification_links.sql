-- Drop and recreate tender notification trigger
DROP TRIGGER IF EXISTS notify_tender_creation_trigger ON tenders;

CREATE OR REPLACE FUNCTION notify_tender_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
BEGIN
    -- Get request name
    SELECT ri.name INTO v_request_name
    FROM tenders t
    LEFT JOIN requests r ON r.id = t.request_id
    LEFT JOIN request_items ri ON ri.request_id = r.id
    WHERE t.id = NEW.id
    LIMIT 1;

    -- Get chat IDs for all suppliers
    FOR v_chat_id IN
        SELECT telegram_chat_id::text
        FROM users
        WHERE role = 'supplier'
        AND telegram_chat_id IS NOT NULL
    LOOP
        -- Format message without link
        v_message := format(
            '🔔 Новый тендер по вашей категории!\n\nНаименование: %s',
            COALESCE(v_request_name, 'Без названия')
        );

        -- Create notification
        INSERT INTO telegram_notifications (
            type,
            metadata,
            created_at,
            sent,
            error
        ) VALUES (
            'NEW_TENDER',
            jsonb_build_object(
                'name', v_request_name,
                'message', v_message,
                'chat_id', v_chat_id
            ),
            NOW(),
            false,
            NULL
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_tender_creation_trigger
    AFTER INSERT ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION notify_tender_creation();

-- Drop and recreate protocol notification trigger
DROP TRIGGER IF EXISTS notify_protocol_completion_trigger ON protocols;

CREATE OR REPLACE FUNCTION notify_protocol_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
BEGIN
    -- Only proceed if protocol is being marked as completed
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get request name based on protocol type
        IF NEW.type = 'cash' THEN
            -- For cash protocols, get name directly from request
            SELECT ri.name INTO v_request_name
            FROM protocols p
            LEFT JOIN requests r ON r.id = p.request_id
            LEFT JOIN request_items ri ON ri.request_id = r.id
            WHERE p.id = NEW.id
            LIMIT 1;
        ELSE
            -- For tender protocols, get name through tender relationship
            SELECT ri.name INTO v_request_name
            FROM protocols p
            LEFT JOIN tenders t ON t.id = p.tender_id
            LEFT JOIN requests r ON r.id = t.request_id
            LEFT JOIN request_items ri ON ri.request_id = r.id
            WHERE p.id = NEW.id
            LIMIT 1;
        END IF;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message without link
            v_message := format(
                'Протокол «%s» ожидает присвоения номера',
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
                    'type', NEW.type,
                    'name', v_request_name,
                    'message', v_message,
                    'chat_id', v_chat_id
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

CREATE TRIGGER notify_protocol_completion_trigger
    AFTER UPDATE ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION notify_protocol_completion();

-- Drop and recreate cash request notification trigger
DROP TRIGGER IF EXISTS notify_cash_request_completion_trigger ON requests;

CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
BEGIN
    -- Only proceed if request is being marked as protocol
    IF NEW.status = 'protocol' AND 
       (OLD.status IS NULL OR OLD.status != 'protocol') THEN
        
        -- Get request name
        SELECT ri.name INTO v_request_name
        FROM requests r
        LEFT JOIN request_items ri ON ri.request_id = r.id
        WHERE r.id = NEW.id
        LIMIT 1;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message without link
            v_message := format(
                'Заявка на наличный расчет «%s» ожидает присвоения номера',
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
                    'chat_id', v_chat_id
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

CREATE TRIGGER notify_cash_request_completion_trigger
    AFTER UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_cash_request_completion();

-- Process notifications immediately
SELECT process_telegram_notifications(); 