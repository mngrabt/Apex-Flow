-- Drop existing triggers
DROP TRIGGER IF EXISTS notify_cash_request_completion_trigger ON requests;
DROP TRIGGER IF EXISTS auto_process_notifications ON telegram_notifications;

-- Create trigger function for cash request completion
CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_total_sum NUMERIC;
    v_chat_id TEXT;
    v_message TEXT;
    v_existing_notification UUID;
BEGIN
    -- Log trigger firing with full request details
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_cash_request_completion',
        'Trigger fired',
        jsonb_build_object(
            'id', NEW.id,
            'type', NEW.type,
            'new_status', NEW.status,
            'old_status', OLD.status,
            'all_fields', row_to_json(NEW)
        )
    );

    -- Only proceed if this is a cash request being marked as protocol
    IF NEW.type = 'cash' AND NEW.status = 'protocol' AND 
       (OLD.status IS NULL OR OLD.status != 'protocol') THEN
        
        -- Check if notification already exists for this request
        SELECT id INTO v_existing_notification
        FROM telegram_notifications
        WHERE metadata->>'requestId' = NEW.id::text
        AND type = 'PROTOCOL_NEEDS_NUMBER'
        AND created_at > NOW() - INTERVAL '1 hour';

        -- If notification already exists, log and exit
        IF v_existing_notification IS NOT NULL THEN
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'notify_cash_request_completion',
                'Notification already exists',
                jsonb_build_object(
                    'request_id', NEW.id,
                    'notification_id', v_existing_notification
                )
            );
            RETURN NEW;
        END IF;

        -- Get request details from request_items
        SELECT 
            name,
            total_sum
        INTO 
            v_request_name,
            v_total_sum
        FROM request_items
        WHERE request_id = NEW.id
        ORDER BY created_at ASC
        LIMIT 1;

        -- Log retrieved request details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Retrieved request details',
            jsonb_build_object(
                'request_id', NEW.id,
                'name', v_request_name,
                'total_sum', v_total_sum
            )
        );

        -- Get Dinara's chat ID
        SELECT telegram_chat_id::text INTO STRICT v_chat_id
        FROM users
        WHERE id = '00000000-0000-0000-0000-000000000006'
        AND telegram_chat_id IS NOT NULL;

        -- Log Dinara's chat ID
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Retrieved Dinara chat ID',
            jsonb_build_object(
                'chat_id', v_chat_id
            )
        );

        IF v_chat_id IS NOT NULL THEN
            -- Format message with the specified format
            v_message := format(
                '📝 Новая заявка на налчиные требует номера%s%s',
                E'\n\n',
                'Название: ' || COALESCE(v_request_name, 'Без названия')
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
                    'requestId', NEW.id
                ),
                NOW(),
                false,
                NULL
            );

            -- Log notification creation
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'notify_cash_request_completion',
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
                'notify_cash_request_completion',
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
            'notify_cash_request_completion',
            'Skipped notification',
            jsonb_build_object(
                'type', NEW.type,
                'reason', CASE
                    WHEN NEW.type != 'cash' THEN 'Not a cash request'
                    WHEN NEW.status != 'protocol' THEN 'Status not protocol'
                    ELSE 'Status was already protocol'
                END,
                'new_status', NEW.status,
                'old_status', OLD.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash request completion
CREATE TRIGGER notify_cash_request_completion_trigger
    AFTER UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_cash_request_completion();
  