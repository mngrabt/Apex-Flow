-- Function to send Telegram notifications
CREATE OR REPLACE FUNCTION send_telegram_notification(
    p_chat_id TEXT,
    p_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_url TEXT := 'https://api.telegram.org/bot7832369613:AAGiV_Ct8Kd6MS6C-2WpRT6pJrawHetIw_U/sendMessage';
    v_response JSONB;
    v_chat_id TEXT;
BEGIN
    -- Convert chat_id to text if it's a number
    v_chat_id := CASE 
        WHEN p_chat_id ~ '^\d+$' THEN p_chat_id -- If it's all digits, use as is
        WHEN p_chat_id ~ '^\d+\.?\d*$' THEN p_chat_id::NUMERIC::TEXT -- If it's a numeric string with decimal
        ELSE p_chat_id -- Otherwise use as is
    END;

    -- Log attempt
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'send_telegram_notification',
        'Attempting to send message',
        jsonb_build_object(
            'chat_id', v_chat_id,
            'message', p_message,
            'original_chat_id', p_chat_id
        )
    );

    -- Make HTTP request to Telegram API using http extension
    SELECT content::jsonb INTO v_response
    FROM http(
        (
            'POST',                                        -- method
            v_url,                                        -- url
            ARRAY[                                        -- headers
                http_header('Content-Type', 'application/json')
            ],
            'application/json',                           -- content_type
            jsonb_build_object(                           -- content
                'chat_id', v_chat_id::NUMERIC,            -- Convert to numeric for Telegram API
                'text', p_message,
                'parse_mode', 'HTML'
            )::text
        )::http_request
    );

    -- Log the response
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'send_telegram_notification',
        'Received response',
        jsonb_build_object(
            'chat_id', v_chat_id,
            'response', v_response,
            'original_chat_id', p_chat_id
        )
    );

    -- Check if the message was sent successfully
    IF v_response->>'ok' = 'true' THEN
        RETURN true;
    ELSE
        -- Log failure details
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (
            'send_telegram_notification',
            'Failed to send message',
            jsonb_build_object(
                'chat_id', v_chat_id,
                'error', v_response->>'description',
                'response', v_response,
                'original_chat_id', p_chat_id
            )
        );
        RETURN false;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Log error details
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'send_telegram_notification',
        'Error sending message',
        jsonb_build_object(
            'error', SQLERRM,
            'state', SQLSTATE,
            'chat_id', v_chat_id,
            'message', p_message,
            'original_chat_id', p_chat_id
        )
    );
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process telegram notifications
CREATE OR REPLACE FUNCTION process_telegram_notifications()
RETURNS void AS $$
DECLARE
    v_notification RECORD;
    v_user_id UUID;
    v_chat_id TEXT;
    v_message TEXT;
BEGIN
    -- Log start of processing
    INSERT INTO debug_logs (function_name, message)
    VALUES ('process_telegram_notifications', 'Starting to process notifications');

    -- Loop through unprocessed notifications
    FOR v_notification IN 
        SELECT * FROM telegram_notifications 
        WHERE sent = false 
        AND (error IS NULL OR retries < 3)
        AND created_at > NOW() - INTERVAL '1 day'
        AND metadata->>'message' IS NOT NULL  -- Only process notifications with a message
        ORDER BY created_at ASC
        LIMIT 100
    LOOP
        BEGIN
            -- Log the notification being processed
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'process_telegram_notifications',
                'Processing notification',
                jsonb_build_object(
                    'notification_id', v_notification.id,
                    'type', v_notification.type,
                    'metadata', v_notification.metadata
                )
            );

            -- Get user ID and chat ID based on notification type
            CASE v_notification.type
                WHEN 'PROTOCOL_NEEDS_NUMBER' THEN
                    v_user_id := '00000000-0000-0000-0000-000000000006'; -- Dinara's ID
                WHEN 'NEW_TENDER' THEN
                    -- For NEW_TENDER, chat_id is directly in metadata
                    v_chat_id := v_notification.metadata->>'chat_id';
                    -- Skip user lookup since we have chat_id directly
                    v_user_id := v_notification.metadata->>'userId';
            END CASE;

            -- Log the extracted values
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'process_telegram_notifications',
                'Extracted notification details',
                jsonb_build_object(
                    'notification_id', v_notification.id,
                    'user_id', v_user_id,
                    'chat_id', v_chat_id,
                    'type', v_notification.type
                )
            );

            -- Get user's telegram_chat_id if not already set
            IF v_chat_id IS NULL AND v_user_id IS NOT NULL THEN
                SELECT telegram_chat_id::text INTO STRICT v_chat_id
                FROM users
                WHERE id = v_user_id
                AND telegram_chat_id IS NOT NULL;

                -- Log the looked up chat_id
                INSERT INTO debug_logs (function_name, message, details)
                VALUES (
                    'process_telegram_notifications',
                    'Looked up chat_id from users table',
                    jsonb_build_object(
                        'notification_id', v_notification.id,
                        'user_id', v_user_id,
                        'chat_id', v_chat_id
                    )
                );
            END IF;

            -- Get message from metadata
            v_message := v_notification.metadata->>'message';

            -- Skip if message is null or empty
            IF v_message IS NULL OR v_message = '' THEN
                -- Mark as processed with error
                UPDATE telegram_notifications
                SET 
                    error = 'Missing message in metadata',
                    processed_at = NOW()
                WHERE id = v_notification.id;
                
                -- Log the skip
                INSERT INTO debug_logs (function_name, message, details)
                VALUES (
                    'process_telegram_notifications',
                    'Skipped - missing message',
                    jsonb_build_object(
                        'notification_id', v_notification.id
                    )
                );
                
                CONTINUE;
            END IF;

            -- Log attempt to send
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'process_telegram_notifications',
                'Attempting to send notification',
                jsonb_build_object(
                    'notification_id', v_notification.id,
                    'chat_id', v_chat_id,
                    'message', v_message
                )
            );

            -- Send the notification
            IF send_telegram_notification(v_chat_id, v_message) THEN
                -- Mark as processed successfully
                UPDATE telegram_notifications
                SET 
                    sent = true,
                    processed_at = NOW(),
                    error = NULL
                WHERE id = v_notification.id;

                -- Log success
                INSERT INTO debug_logs (function_name, message, details)
                VALUES (
                    'process_telegram_notifications',
                    'Notification sent successfully',
                    jsonb_build_object(
                        'notification_id', v_notification.id,
                        'chat_id', v_chat_id
                    )
                );
            ELSE
                -- Increment retry counter
                UPDATE telegram_notifications
                SET 
                    retries = COALESCE(retries, 0) + 1,
                    error = 'Failed to send message'
                WHERE id = v_notification.id;

                -- Log failure
                INSERT INTO debug_logs (function_name, message, details)
                VALUES (
                    'process_telegram_notifications',
                    'Failed to send notification',
                    jsonb_build_object(
                        'notification_id', v_notification.id,
                        'chat_id', v_chat_id,
                        'retries', COALESCE(v_notification.retries, 0) + 1
                    )
                );
            END IF;

        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed
            UPDATE telegram_notifications
            SET 
                error = SQLERRM,
                retries = COALESCE(retries, 0) + 1,
                processed_at = NOW()
            WHERE id = v_notification.id;

            -- Log error
            INSERT INTO debug_logs (function_name, message, details)
            VALUES (
                'process_telegram_notifications',
                'Error processing notification',
                jsonb_build_object(
                    'notification_id', v_notification.id,
                    'error', SQLERRM,
                    'state', SQLSTATE,
                    'chat_id', v_chat_id,
                    'type', v_notification.type,
                    'metadata', v_notification.metadata
                )
            );
        END;
    END LOOP;

    -- Log completion
    INSERT INTO debug_logs (function_name, message)
    VALUES ('process_telegram_notifications', 'Completed processing notifications');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 