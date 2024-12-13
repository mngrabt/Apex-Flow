CREATE OR REPLACE FUNCTION sign_and_complete_protocol(
  p_protocol_id UUID,
  p_user_id UUID,
  p_current_date TIMESTAMP WITH TIME ZONE
)
RETURNS void AS $$
DECLARE
  v_protocol_status TEXT;
  v_tender_id UUID;
  v_request_id UUID;
  v_request_status TEXT;
BEGIN
  -- Get protocol status and related IDs
  SELECT status, tender_id INTO v_protocol_status, v_tender_id
  FROM protocols
  WHERE id = p_protocol_id;

  -- Get request ID and status
  SELECT r.id, r.status INTO v_request_id, v_request_status
  FROM tenders t
  JOIN requests r ON r.id = t.request_id
  WHERE t.id = v_tender_id;

  -- Add signature
  INSERT INTO protocol_signatures (protocol_id, user_id, date)
  VALUES (p_protocol_id, p_user_id, p_current_date);

  -- Check if all required signatures are present
  IF (
    -- Check if Abdurauf has signed
    EXISTS (
      SELECT 1 FROM protocol_signatures
      WHERE protocol_id = p_protocol_id
      AND user_id = '00000000-0000-0000-0000-000000000001'
    )
    AND
    -- Check if Fozil has signed
    EXISTS (
      SELECT 1 FROM protocol_signatures
      WHERE protocol_id = p_protocol_id
      AND user_id = '00000000-0000-0000-0000-000000000003'
    )
    AND
    -- Check if Aziz has signed
    EXISTS (
      SELECT 1 FROM protocol_signatures
      WHERE protocol_id = p_protocol_id
      AND user_id = '00000000-0000-0000-0000-000000000004'
    )
    AND
    -- Check if Umar has signed
    EXISTS (
      SELECT 1 FROM protocol_signatures
      WHERE protocol_id = p_protocol_id
      AND user_id = '00000000-0000-0000-0000-000000000005'
    )
  ) THEN
    -- Update protocol status
    UPDATE protocols
    SET 
      status = 'completed',
      finance_status = 'not_submitted'
    WHERE id = p_protocol_id;

    -- Update tender status
    UPDATE tenders
    SET status = 'completed'
    WHERE id = v_tender_id;

    -- Update request status only if it's in a valid state
    IF v_request_status IN ('active', 'pending') THEN
      UPDATE requests
      SET status = 'completed'
      WHERE id = v_request_id;
    END IF;

    -- Create archive entry
    INSERT INTO archived_protocols (
      protocol_id,
      created_at
    ) VALUES (
      p_protocol_id,
      p_current_date
    )
    ON CONFLICT (protocol_id) 
    DO UPDATE SET
      created_at = EXCLUDED.created_at;
  END IF;
END;
$$ LANGUAGE plpgsql; 