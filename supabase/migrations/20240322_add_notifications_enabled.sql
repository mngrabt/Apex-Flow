-- Add notifications_enabled column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN users.notifications_enabled IS 'Whether the user should receive Telegram notifications';

-- Log the column addition
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'add_notifications_enabled',
    'Added notifications_enabled column to users table',
    jsonb_build_object(
        'table', 'users',
        'column', 'notifications_enabled',
        'default_value', true
    )
); 