-- Enable HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Create webhook endpoint
CREATE OR REPLACE FUNCTION handle_telegram_webhook()
RETURNS http_response AS $$
DECLARE
    request http_request := current_request();
    v_response jsonb;
BEGIN
    -- Only allow POST requests
    IF request.method <> 'POST' THEN
        RETURN http_response(
            status => 405,
            content_type => 'application/json',
            content => '{"ok":false,"error":"Method not allowed"}'
        );
    END IF;

    -- Process the webhook
    v_response := process_telegram_webhook(request.content::jsonb);

    -- Return response
    RETURN http_response(
        status => CASE 
            WHEN v_response->>'ok' = 'true' THEN 200 
            ELSE 500 
        END,
        content_type => 'application/json',
        content => v_response::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 