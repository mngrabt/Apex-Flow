-- Ensure notifications_enabled column exists
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON TABLE users TO postgres;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- Add comment explaining the column
COMMENT ON COLUMN users.notifications_enabled IS 'Whether the user should receive Telegram notifications';

-- Log the fix
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_notifications_enabled',
    'Ensured notifications_enabled column exists with proper permissions',
    jsonb_build_object(
        'table', 'users',
        'column', 'notifications_enabled',
        'default_value', true
    )
); 