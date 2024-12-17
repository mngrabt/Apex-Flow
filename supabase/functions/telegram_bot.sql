-- Create or replace the function to handle Telegram bot commands
CREATE OR REPLACE FUNCTION handle_telegram_bot_command(update_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_chat_id BIGINT;
    v_message_text TEXT;
    v_user_id BIGINT;
    v_phone_number TEXT;
    v_response JSONB;
    v_telegram_api TEXT := 'https://api.telegram.org/bot7832369613:AAFr_slHVkZ-Dx8Th_IX0GehbnFutE_CHmk';
BEGIN
    -- Extract data from the update
    v_chat_id := (update_data->'message'->'chat'->>'id')::BIGINT;
    v_message_text := update_data->'message'->>'text';
    v_user_id := (update_data->'message'->'from'->>'id')::BIGINT;

    -- Log the received update
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('handle_telegram_bot_command', 'Received update', update_data);

    -- Handle /start command
    IF v_message_text = '/start' THEN
        -- Send welcome message with contact button
        SELECT content::jsonb INTO v_response
        FROM http((
            'POST',
            v_telegram_api || '/sendMessage',
            ARRAY[http_header('Content-Type', 'application/json')],
            'application/json',
            jsonb_build_object(
                'chat_id', v_chat_id,
                'text', 'Добро пожаловать в систему ApexFlow!

Для завершения регистрации нажмите кнопку «Поделиться контактом» ниже.',
                'parse_mode', 'HTML',
                'reply_markup', jsonb_build_object(
                    'keyboard', jsonb_build_array(
                        jsonb_build_array(
                            jsonb_build_object(
                                'text', 'Поделиться контактом',
                                'request_contact', true
                            )
                        )
                    ),
                    'resize_keyboard', true,
                    'one_time_keyboard', true
                )
            )::text
        )::http_request);

        RETURN jsonb_build_object('ok', true);
    END IF;

    -- Handle contact sharing
    IF update_data->'message'->'contact' IS NOT NULL THEN
        v_phone_number := update_data->'message'->'contact'->>'phone_number';
        
        -- Verify that the contact belongs to the user
        IF v_user_id = (update_data->'message'->'contact'->>'user_id')::BIGINT THEN
            -- Send processing message
            PERFORM http((
                'POST',
                v_telegram_api || '/sendMessage',
                ARRAY[http_header('Content-Type', 'application/json')],
                'application/json',
                jsonb_build_object(
                    'chat_id', v_chat_id,
                    'text', 'Обработка...',
                    'reply_markup', jsonb_build_object('remove_keyboard', true)
                )::text
            )::http_request);

            -- Clean phone number and add prefix if needed
            v_phone_number := regexp_replace(v_phone_number, '\D', '', 'g');
            IF NOT v_phone_number LIKE '998%' THEN
                v_phone_number := '998' || v_phone_number;
            END IF;

            -- Delete any existing verifications
            DELETE FROM telegram_verifications
            WHERE chat_id = v_chat_id OR phone_number = v_phone_number;

            -- Insert new verification
            INSERT INTO telegram_verifications (chat_id, phone_number, verified_at)
            VALUES (v_chat_id, v_phone_number, NOW());

            -- Send success message
            PERFORM http((
                'POST',
                v_telegram_api || '/sendMessage',
                ARRAY[http_header('Content-Type', 'application/json')],
                'application/json',
                jsonb_build_object(
                    'chat_id', v_chat_id,
                    'text', 'Контактные данные получены. Вернитесь в приложение для продолжения процесса регистрации.',
                    'reply_markup', jsonb_build_object('remove_keyboard', true)
                )::text
            )::http_request);
        END IF;

        RETURN jsonb_build_object('ok', true);
    END IF;

    RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'handle_telegram_bot_command',
        'Error processing command',
        jsonb_build_object(
            'error', SQLERRM,
            'state', SQLSTATE,
            'update_data', update_data
        )
    );

    -- Try to send error message to user
    PERFORM http((
        'POST',
        v_telegram_api || '/sendMessage',
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        jsonb_build_object(
            'chat_id', v_chat_id,
            'text', 'Произошла ошибка. Пожалуйста, попробуйте позже.',
            'reply_markup', jsonb_build_object('remove_keyboard', true)
        )::text
    )::http_request);

    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to process webhook updates
CREATE OR REPLACE FUNCTION process_telegram_webhook(request jsonb)
RETURNS jsonb AS $$
BEGIN
    -- Log incoming webhook
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('process_telegram_webhook', 'Received webhook', request);

    -- Process the update
    RETURN handle_telegram_bot_command(request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 