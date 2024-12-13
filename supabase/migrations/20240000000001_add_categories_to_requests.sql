-- Add categories column to requests table
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Update existing rows to have empty array if null
UPDATE requests
SET categories = '{}'
WHERE categories IS NULL; 