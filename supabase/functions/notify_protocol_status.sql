-- Function to send notification when a request status changes to 'protocol'
CREATE OR REPLACE FUNCTION notify_protocol_status()
RETURNS TRIGGER AS $$
DECLARE
    v_department TEXT;
BEGIN
    -- Only proceed if status changed to 'protocol'
    IF NEW.status = 'protocol' AND (OLD.status IS NULL OR OLD.status != 'protocol') THEN
        -- Get department
        SELECT department INTO v_department
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
                'type', 'cash',
                'department', v_department,
                'requestNumber', NEW.number
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
    AFTER UPDATE OF status
    ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_protocol_status(); 