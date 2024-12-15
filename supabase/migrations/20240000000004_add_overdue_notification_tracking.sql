-- Add overdue notification tracking to protocols
ALTER TABLE protocols
ADD COLUMN overdue_notified BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN protocols.overdue_notified IS 'Tracks whether an overdue notification has been sent for this protocol'; 