-- Create a function to handle cash request completion notifications
CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_department TEXT;
    v_request_number TEXT;
BEGIN
    -- Log the incoming request details
    RAISE NOTICE 'Cash request trigger fired: id=%, type=%, old_status=%, new_status=%', 
        NEW.id, NEW.type, OLD.status, NEW.status;

    -- Only proceed if this is a cash request being marked as approved
    IF NEW.type = 'cash' AND NEW.status = 'approved' AND 
       (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        RAISE NOTICE 'Cash request status change detected: id=%, from status % to %',
            NEW.id, OLD.status, NEW.status;
        
        -- Get request details
        SELECT 
            ri.name,
            r.department,
            r.number
        INTO 
            v_request_name,
            v_department,
            v_request_number
        FROM requests r
        LEFT JOIN request_items ri ON ri.request_id = r.id
        WHERE r.id = NEW.id
        LIMIT 1;

        RAISE NOTICE 'Retrieved request details: name=%, department=%, number=%',
            v_request_name, v_department, v_request_number;

        -- Insert notification for Dinara
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
                'requestNumber', v_request_number,
                'name', COALESCE(v_request_name, 'Unnamed Request')
            ),
            NOW(),
            false,
            NULL
        );

        RAISE NOTICE 'Created notification for completed cash request: name=%, department=%, number=%', 
            v_request_name, v_department, v_request_number;
    ELSE
        RAISE NOTICE 'Skipping notification: type=%, old_status=%, new_status=%',
            NEW.type, OLD.status, NEW.status;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in notify_cash_request_completion: %, %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cash_request_completion_trigger ON requests;

-- Create trigger for cash request completions
CREATE TRIGGER cash_request_completion_trigger
    AFTER UPDATE
    ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_cash_request_completion(); 