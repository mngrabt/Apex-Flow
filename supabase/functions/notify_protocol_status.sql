-- Function to send notification when a request status changes to 'protocol'
CREATE OR REPLACE FUNCTION notify_protocol_status()
RETURNS TRIGGER AS $$
DECLARE
    v_department TEXT;
    v_items JSONB;
BEGIN
    -- Only proceed if status changed to 'protocol' AND it's not a cash request
    IF NEW.status = 'protocol' AND (OLD.status IS NULL OR OLD.status != 'protocol') AND NEW.type != 'cash' THEN
        -- Get department and items
        SELECT department, items INTO v_department, v_items
        FROM requests
        WHERE id = NEW.id;

        -- Insert into telegram_notifications queue
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
                'name', v_items->0->>'name',
                'department', v_department,
                'requestId', NEW.id,
                'number', NEW.number
            ),
            NOW(),
            false,
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS notify_protocol_status_trigger ON requests;

-- Create trigger for requests table
CREATE TRIGGER notify_protocol_status_trigger
    AFTER UPDATE OF status ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_protocol_status(); 