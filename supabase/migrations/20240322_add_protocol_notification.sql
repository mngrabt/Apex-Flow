-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS notify_protocol_completion_trigger ON protocols;

-- Create trigger function for protocol completion
CREATE OR REPLACE FUNCTION notify_protocol_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_chat_id TEXT;
    v_message TEXT;
    v_existing_notification UUID;
BEGIN
    -- Log trigger firing with full protocol details
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_protocol_completion',
        'Trigger fired',
        jsonb_build_object(
            'id', NEW.id,
            'status', NEW.status,
            'old_status', OLD.status,
            'all_fields', row_to_json(NEW)
        )
    );

    -- Only proceed if protocol is being marked as completed
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Check if notification already exists for this protocol
        SELECT id INTO v_existing_notification
        FROM telegram_notifications
        WHERE metadata->>'protocolId' = NEW.id::text
        AND type = 'PROTOCOL_NEEDS_NUMBER'
        AND created_at > NOW() - INTERVAL '1 hour';

        -- If notification already exists, log and exit
        IF v_existing_notification IS NOT NULL THEN
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'notify_protocol_completion',
                'Notification already exists',
                jsonb_build_object(
                    'protocol_id', NEW.id,
                    'notification_id', v_existing_notification
                )
            );
            RETURN NEW;
        END IF;

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

        -- Log retrieved request details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_protocol_completion',
            'Retrieved request details',
            jsonb_build_object(
                'protocol_id', NEW.id,
                'type', NEW.type,
                'name', v_request_name,
                'tender_id', NEW.tender_id,
                'request_id', NEW.request_id
            )
        );

        -- Get Dinara's chat ID (without STRICT)
        SELECT telegram_chat_id::text INTO v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        -- Log Dinara's chat ID
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_protocol_completion',
            'Retrieved Dinara chat ID',
            jsonb_build_object(
                'chat_id', v_chat_id,
                'found', v_chat_id IS NOT NULL
            )
        );

        IF v_chat_id IS NOT NULL THEN
            -- Format message with the specified format
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
                    'chat_id', v_chat_id,
                    'department', COALESCE(
                        (SELECT department FROM requests WHERE id = NEW.request_id),
                        (SELECT r.department FROM tenders t JOIN requests r ON r.id = t.request_id WHERE t.id = NEW.tender_id)
                    )
                ),
                NOW(),
                false,
                NULL
            );

            -- Log notification creation
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'notify_protocol_completion',
                'Created notification',
                jsonb_build_object(
                    'name', v_request_name,
                    'message', v_message,
                    'chat_id', v_chat_id
                )
            );

            -- Process notifications immediately
            PERFORM process_telegram_notifications();
        ELSE
            -- Log missing chat ID
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'notify_protocol_completion',
                'No chat ID found for Dinara',
                jsonb_build_object(
                    'user_id', '00000000-0000-0000-0000-000000000006'
                )
            );
        END IF;
    ELSE
        -- Log skipped notification with more details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_protocol_completion',
            'Skipped notification',
            jsonb_build_object(
                'status', NEW.status,
                'reason', CASE
                    WHEN NEW.status != 'completed' THEN 'Status not completed'
                    ELSE 'Status was already completed'
                END,
                'new_status', NEW.status,
                'old_status', OLD.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for protocol completion
CREATE TRIGGER notify_protocol_completion_trigger
    AFTER UPDATE ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION notify_protocol_completion(); 