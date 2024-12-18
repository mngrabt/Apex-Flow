-- Update protocol completion notification function to skip cash protocols
CREATE OR REPLACE FUNCTION notify_protocol_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
    v_existing_notification UUID;
BEGIN
    -- Skip if this is a cash protocol
    IF NEW.type = 'cash' THEN
        RETURN NEW;
    END IF;

    -- Only proceed if protocol is being marked as completed
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get request name from tender
        SELECT ri.name INTO v_request_name
        FROM protocols p
        LEFT JOIN tenders t ON t.id = p.tender_id
        LEFT JOIN requests r ON r.id = t.request_id
        LEFT JOIN request_items ri ON ri.request_id = r.id
        WHERE p.id = NEW.id
        LIMIT 1;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO STRICT v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message with line breaks
            v_message := format(
                E'Протокол «%s» ожидает присвоения номера\n\nПерейти к архиву: https://apexflow.uz/archive',
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
                    'type', 'protocol',
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS notify_protocol_completion_trigger ON protocols;

CREATE TRIGGER notify_protocol_completion_trigger
    AFTER UPDATE ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION notify_protocol_completion();

-- Create separate function for cash protocol notifications
CREATE OR REPLACE FUNCTION notify_cash_protocol_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
BEGIN
    -- Only proceed if this is a cash protocol and it's completed
    IF NEW.type = 'cash' AND NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get request name
        SELECT ri.name INTO v_request_name
        FROM protocols p
        LEFT JOIN requests r ON r.id = p.request_id
        LEFT JOIN request_items ri ON ri.request_id = r.id
        WHERE p.id = NEW.id
        LIMIT 1;

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO STRICT v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        IF v_chat_id IS NOT NULL THEN
            -- Format message
            v_message := format(
                E'Заявка на наличный расчет «%s» ожидает присвоения номера\n\nПерейти к архиву: https://apexflow.uz/archive?view=cash',
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
                    'protocolId', NEW.id,
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

-- Create trigger for cash protocol notifications
DROP TRIGGER IF EXISTS notify_cash_protocol_completion_trigger ON protocols;

CREATE TRIGGER notify_cash_protocol_completion_trigger
    AFTER UPDATE ON protocols
    FOR EACH ROW
    WHEN (NEW.type = 'cash')
    EXECUTE FUNCTION notify_cash_protocol_completion(); 