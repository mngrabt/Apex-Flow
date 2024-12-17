-- Create debug logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS debug_logs (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create telegram verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS telegram_verifications (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    phone_number TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id),
    UNIQUE(phone_number)
); 