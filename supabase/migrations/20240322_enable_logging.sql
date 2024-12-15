-- Create a table to store our logs
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_name TEXT,
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create required types
DO $$
BEGIN
    -- Create http_header type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'http_header') THEN
        CREATE TYPE http_header AS (
            field_name text,
            field_value text
        );
    END IF;

    -- Create http_request type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'http_request') THEN
        CREATE TYPE http_request AS (
            method text,
            uri text,
            headers http_header[],
            content_type text,
            content text
        );
    END IF;
END$$;

-- Modify our notification function to handle protocol status
CREATE OR REPLACE FUNCTION notify_cash_request_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_request_details RECORD;
    v_notification_id UUID;
BEGIN
    -- Log trigger firing
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'notify_cash_request_completion',
        'Trigger fired',
        jsonb_build_object(
            'id', NEW.id,
            'type', NEW.type,
            'new_status', NEW.status,
            'old_status', OLD.status
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

        -- Get request details
        SELECT 
            r.name,
            r.number,
            r.total_sum,
            d.name as department
        INTO v_request_details
        FROM requests r
        LEFT JOIN departments d ON d.id = r.department_id
        WHERE r.id = NEW.id;

        -- Log retrieved details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Retrieved request details',
            jsonb_build_object(
                'name', v_request_details.name,
                'number', v_request_details.number,
                'total_sum', v_request_details.total_sum,
                'department', v_request_details.department
            )
        );

        -- Create notification
        INSERT INTO telegram_notifications (
            type,
            metadata
        ) VALUES (
            'PROTOCOL_NEEDS_NUMBER',
            jsonb_build_object(
                'type', NEW.type,
                'name', v_request_details.name,
                'number', v_request_details.number,
                'totalSum', v_request_details.total_sum,
                'department', v_request_details.department,
                'requestId', NEW.id
            )
        ) RETURNING id INTO v_notification_id;

        -- Log notification creation
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Created notification',
            jsonb_build_object(
                'name', v_request_details.name,
                'number', v_request_details.number,
                'total_sum', v_request_details.total_sum,
                'department', v_request_details.department
            )
        );
    ELSE
        -- Log skipped notification
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'notify_cash_request_completion',
            'Skipped notification',
            jsonb_build_object(
                'type', NEW.type,
                'reason', 'Status not protocol',
                'new_status', NEW.status,
                'old_status', OLD.status
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