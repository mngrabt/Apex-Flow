-- Drop existing function first
DROP FUNCTION IF EXISTS submit_protocol(UUID, TEXT, TIMESTAMPTZ);

-- Create new function
CREATE OR REPLACE FUNCTION submit_protocol(
  p_protocol_id UUID,
  p_urgency TEXT,
  p_current_date TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  -- Just update the protocol status
  UPDATE protocols 
  SET 
    finance_status = 'waiting',
    urgency = p_urgency,
    submitted_at = p_current_date
  WHERE id = p_protocol_id;
END;
$$ LANGUAGE plpgsql; 