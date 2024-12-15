-- Add categories column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Update existing rows to have empty array if null
UPDATE users
SET categories = '{}'
WHERE categories IS NULL;

-- Add index for better performance when querying by categories
CREATE INDEX IF NOT EXISTS idx_users_categories ON users USING GIN (categories);

-- Add comment explaining the column
COMMENT ON COLUMN users.categories IS 'Array of categories that a supplier user is interested in'; 