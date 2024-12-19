-- Add type column to protocol_signatures table
ALTER TABLE protocol_signatures ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing signatures based on their protocol type
UPDATE protocol_signatures ps
SET type = p.type
FROM protocols p
WHERE ps.protocol_id = p.id AND ps.type IS NULL;

-- Make type column NOT NULL after updating existing records
ALTER TABLE protocol_signatures ALTER COLUMN type SET NOT NULL; 