-- First update any existing requests with invalid status
UPDATE requests 
SET status = 'completed' 
WHERE status NOT IN ('draft', 'pending', 'active', 'completed', 'archived', 'rejected');

-- Then update the constraint
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE requests
ADD CONSTRAINT requests_status_check 
CHECK (status IN ('draft', 'pending', 'active', 'completed', 'archived', 'rejected'));

-- Make zip_url optional in archived_protocols table
ALTER TABLE archived_protocols 
ALTER COLUMN zip_url DROP NOT NULL; 