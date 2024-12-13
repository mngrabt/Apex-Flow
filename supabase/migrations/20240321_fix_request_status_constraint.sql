-- First update any existing requests with invalid status
UPDATE requests 
SET status = 'pending' 
WHERE status NOT IN ('draft', 'pending', 'tender', 'protocol', 'archived');

-- Then update the constraint
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE requests
ADD CONSTRAINT requests_status_check 
CHECK (status IN ('draft', 'pending', 'tender', 'protocol', 'archived')); 