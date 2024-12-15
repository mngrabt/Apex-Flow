-- Update Dinara's telegram_chat_id
UPDATE users 
SET telegram_chat_id = '2041833916'  -- Dinara's actual Telegram chat ID
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Log the update
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'ensure_dinara_telegram',
    'Updated Dinara chat ID',
    jsonb_build_object(
        'user_id', '00000000-0000-0000-0000-000000000006',
        'chat_id', '2041833916'
    )
);

-- Create a function to process telegram notifications
CREATE OR REPLACE FUNCTION process_telegram_notifications()
RETURNS void AS $$
DECLARE
    v_notification RECORD;
    v_user_id UUID;
    v_message TEXT;
BEGIN
    -- Loop through unprocessed notifications
    FOR v_notification IN 
        SELECT * FROM telegram_notifications 
        WHERE sent = false AND error IS NULL
        ORDER BY created_at ASC
        LIMIT 100
    LOOP
        BEGIN
            -- Get user ID based on notification type
            CASE v_notification.type
                WHEN 'PROTOCOL_NEEDS_NUMBER' THEN
                    v_user_id := '00000000-0000-0000-0000-000000000006'; -- Dinara's ID
                -- Add more cases as needed
            END CASE;

            -- Get user's telegram_chat_id
            SELECT telegram_chat_id INTO STRICT v_message
            FROM users
            WHERE id = v_user_id
            AND telegram_chat_id IS NOT NULL;

            -- Mark as processed
            UPDATE telegram_notifications
            SET 
                sent = true,
                processed_at = NOW()
            WHERE id = v_notification.id;

        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed
            UPDATE telegram_notifications
            SET 
                error = SQLERRM,
                processed_at = NOW()
            WHERE id = v_notification.id;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically process notifications
CREATE OR REPLACE FUNCTION trigger_process_notifications()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM process_telegram_notifications();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to process notifications when new ones are added
DROP TRIGGER IF EXISTS auto_process_notifications ON telegram_notifications;
CREATE TRIGGER auto_process_notifications
    AFTER INSERT ON telegram_notifications
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_process_notifications(); 