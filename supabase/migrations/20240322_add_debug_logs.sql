-- Create a table to store our debug logs
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_name TEXT,
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify our notification function to include debug logging
CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_name TEXT;
    v_department TEXT;
    v_request_number TEXT;
    v_total_sum NUMERIC;
BEGIN
    -- Log trigger firing
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_cash_request_completion',
        'Trigger fired',
        jsonb_build_object(
            'id', NEW.id,
            'type', NEW.type,
            'old_status', OLD.status,
            'new_status', NEW.status
        )
    );

    -- Only proceed if this is a cash request being marked as protocol
    IF NEW.type = 'cash' AND NEW.status = 'protocol' AND 
       (OLD.status IS NULL OR OLD.status != 'protocol') THEN
        
        -- Log status change
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Status change detected',
            jsonb_build_object(
                'id', NEW.id,
                'from_status', OLD.status,
                'to_status', NEW.status
            )
        );
        
        -- Get request details with first item details
        SELECT 
            COALESCE(ri.name, 'Unnamed Request'),
            NEW.department,
            NEW.number,
            ri.total_sum
        INTO 
            v_request_name,
            v_department,
            v_request_number,
            v_total_sum
        FROM request_items ri
        WHERE ri.request_id = NEW.id
        ORDER BY ri.created_at ASC
        LIMIT 1;

        -- Log retrieved details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Retrieved request details',
            jsonb_build_object(
                'name', v_request_name,
                'department', v_department,
                'number', v_request_number,
                'total_sum', v_total_sum
            )
        );

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
                'name', v_request_name,
                'totalSum', v_total_sum
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
                'department', v_department,
                'number', v_request_number,
                'total_sum', v_total_sum
            )
        );
    ELSE
        -- Log why notification was skipped
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Skipped notification',
            jsonb_build_object(
                'reason', CASE 
                    WHEN NEW.type != 'cash' THEN 'Not a cash request'
                    WHEN NEW.status != 'protocol' THEN 'Status not protocol'
                    ELSE 'Status was already protocol'
                END,
                'type', NEW.type,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_cash_request_completion',
        'Error occurred',
        jsonb_build_object(
            'error', SQLERRM,
            'state', SQLSTATE
        )
    );
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