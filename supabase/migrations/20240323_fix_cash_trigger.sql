-- Drop the existing trigger first
DROP TRIGGER IF EXISTS cash_request_notification_trigger ON cash_requests;

-- Create a new function specifically for cash requests
CREATE OR REPLACE FUNCTION handle_cash_request_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_chat_id TEXT;
BEGIN
    -- Get Dinara's chat ID
    SELECT telegram_chat_id::text INTO STRICT v_chat_id
    FROM users
    WHERE id = '00000000-0000-0000-0000-000000000006'
    AND telegram_chat_id IS NOT NULL;

    IF v_chat_id IS NOT NULL THEN
        -- Insert notification for cash request number needed
        INSERT INTO telegram_notifications (
            type,
            metadata,
            created_at,
            sent,
            error
        ) VALUES (
            'PROTOCOL_NUMBER_NEEDED',
            jsonb_build_object(
                'type', 'cash',
                'name', NEW.number,
                'department', NEW.department,
                'requestId', NEW.id,
                'number', NEW.number,
                'message', format(E'Заявка на наличный расчет «%s» ожидает присвоения номера\n\nПерейти к архиву: https://apexflow.uz/archive?view=cash', NEW.number),
                'chat_id', v_chat_id
            ),
            NOW(),
            false,
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger with the correct function
CREATE TRIGGER cash_request_notification_trigger
    AFTER INSERT ON cash_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_cash_request_notification(); 