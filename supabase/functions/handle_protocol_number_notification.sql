-- Function to handle protocol number notifications
CREATE OR REPLACE FUNCTION handle_protocol_number_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status changed to 'protocol'
    IF NEW.status = 'protocol' AND (OLD.status IS NULL OR OLD.status != 'protocol') THEN
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
                'department', NEW.department,
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