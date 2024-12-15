-- Add missing columns to protocols table
ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('tender', 'cash')),
ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES requests(id) ON DELETE CASCADE;

-- Update existing protocols
UPDATE protocols p
SET 
  type = CASE
    WHEN tender_id IS NOT NULL THEN 'tender'
    WHEN request_id IS NOT NULL THEN 'cash'
    ELSE 'tender'
  END; 