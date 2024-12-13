CREATE OR REPLACE FUNCTION complete_protocol(
  p_protocol_id UUID,
  p_current_date TIMESTAMPTZ
) RETURNS void AS $$
DECLARE
  v_signature_count INTEGER;
  v_required_signatures INTEGER := 4;
  v_protocol RECORD;
  v_tender RECORD;
  v_request RECORD;
  v_winner RECORD;
BEGIN
  -- Count existing signatures
  SELECT COUNT(*) INTO v_signature_count
  FROM protocol_signatures
  WHERE protocol_id = p_protocol_id;

  -- Only proceed if we have all required signatures
  IF v_signature_count >= v_required_signatures THEN
    -- Get protocol, tender, and request data
    SELECT p.* INTO v_protocol
    FROM protocols p
    WHERE p.id = p_protocol_id;

    SELECT t.* INTO v_tender
    FROM tenders t
    WHERE t.id = v_protocol.tender_id;

    SELECT r.* INTO v_request
    FROM requests r
    WHERE r.id = v_tender.request_id;

    -- Get winner data
    SELECT s.* INTO v_winner
    FROM suppliers s
    WHERE s.id = v_tender.winner_id;

    -- Update protocol status
    UPDATE protocols 
    SET 
      status = 'completed',
      finance_status = 'not_submitted',
      completed_at = p_current_date
    WHERE id = p_protocol_id;

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

</```rewritten_file>