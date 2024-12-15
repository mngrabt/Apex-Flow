-- Drop table if exists to ensure clean state
DROP TABLE IF EXISTS telegram_notifications;

-- Create telegram_notifications table
CREATE TABLE telegram_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    sent BOOLEAN DEFAULT false,
    error TEXT,
    retries INTEGER DEFAULT 0
);

-- Add indexes for performance
CREATE INDEX idx_unprocessed_notifications 
ON telegram_notifications (sent, error) 
WHERE sent = false AND error IS NULL;

CREATE INDEX idx_notification_type 
ON telegram_notifications (type);

-- Add table and column comments
COMMENT ON TABLE telegram_notifications IS 'Queue for Telegram notifications to be sent to users';
COMMENT ON COLUMN telegram_notifications.type IS 'Type of notification (e.g., PROTOCOL_NEEDS_NUMBER)';
COMMENT ON COLUMN telegram_notifications.metadata IS 'Additional data needed for the notification';
COMMENT ON COLUMN telegram_notifications.sent IS 'Whether the notification has been sent successfully';
COMMENT ON COLUMN telegram_notifications.error IS 'Error message if sending failed';
COMMENT ON COLUMN telegram_notifications.retries IS 'Number of times we tried to send this notification'; 