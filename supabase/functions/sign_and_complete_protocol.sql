CREATE OR REPLACE FUNCTION sign_and_complete_protocol(
  p_protocol_id UUID,
  p_user_id UUID,
  p_current_date TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
  v_protocol_type TEXT;
  v_request_number TEXT;
  v_required_signers UUID[];
  v_current_signers UUID[] := ARRAY[]::UUID[];  -- Initialize to empty array
  v_tender_id UUID;
  v_request_id UUID;
  v_protocol RECORD;
BEGIN
  -- Log input parameters
  RAISE NOTICE 'Starting sign_and_complete_protocol with protocol_id: %, user_id: %', p_protocol_id, p_user_id;

  -- Get protocol details
  SELECT * INTO v_protocol
  FROM protocols
  WHERE id = p_protocol_id;

  IF v_protocol IS NULL THEN
    RAISE EXCEPTION 'Protocol not found with ID: %', p_protocol_id;
  END IF;

  v_tender_id := v_protocol.tender_id;
  v_request_id := v_protocol.request_id;

  RAISE NOTICE 'Found protocol with tender_id: %, request_id: %', v_tender_id, v_request_id;

  -- Determine protocol type based on IDs
  v_protocol_type := CASE
    WHEN v_tender_id IS NOT NULL THEN 'tender'
    WHEN v_request_id IS NOT NULL THEN 'cash'
    ELSE 'tender' -- Default to tender if neither is present
  END;

  RAISE NOTICE 'Determined protocol type: %', v_protocol_type;

  -- Get request number if it exists (handle NULL case)
  SELECT r.number INTO v_request_number
  FROM protocols p
  LEFT JOIN requests r ON r.id = COALESCE(p.request_id, 
    (SELECT request_id FROM tenders WHERE id = p.tender_id))
  WHERE p.id = p_protocol_id;

  -- v_request_number can be NULL here, that's fine

  RAISE NOTICE 'Found request number: %', COALESCE(v_request_number, 'NULL');

  -- Add the signature
  BEGIN
    INSERT INTO protocol_signatures (
      protocol_id,
      user_id,
      date
    ) VALUES (
      p_protocol_id,
      p_user_id,
      p_current_date
    );
    RAISE NOTICE 'Added signature for user: %', p_user_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Signature already exists for user: %', p_user_id;
  END;

  -- Determine required signers based on protocol type
  v_required_signers := CASE 
    WHEN v_protocol_type = 'cash' THEN 
      ARRAY['00000000-0000-0000-0000-000000000001'::UUID,  -- Abdurauf
            '00000000-0000-0000-0000-000000000003'::UUID,  -- Fozil
            '00000000-0000-0000-0000-000000000004'::UUID]  -- Aziz
    ELSE 
      ARRAY['00000000-0000-0000-0000-000000000001'::UUID,  -- Abdurauf
            '00000000-0000-0000-0000-000000000003'::UUID,  -- Fozil
            '00000000-0000-0000-0000-000000000004'::UUID,  -- Aziz
            '00000000-0000-0000-0000-000000000005'::UUID]  -- Umarali
  END;

  RAISE NOTICE 'Required signers: %', v_required_signers;

  -- Get current signers (handle NULL case)
  WITH current_sigs AS (
    SELECT ARRAY_AGG(user_id) as sigs
    FROM protocol_signatures
    WHERE protocol_id = p_protocol_id
  )
  SELECT COALESCE(sigs, ARRAY[]::UUID[]) INTO v_current_signers
  FROM current_sigs;

  RAISE NOTICE 'Current signers: %', v_current_signers;

  -- Check if all required signatures are present
  IF v_current_signers @> v_required_signers THEN
    RAISE NOTICE 'All required signatures present, completing protocol';
    
    -- Update protocol status to completed and set finance status
    UPDATE protocols
    SET 
      status = 'completed',
      finance_status = 'not_submitted'
    WHERE id = p_protocol_id;

    RAISE NOTICE 'Updated protocol status to completed and set finance_status';

    -- Add to archived_protocols
    BEGIN
      INSERT INTO archived_protocols (
        protocol_id,
        created_at
      ) VALUES (
        p_protocol_id,
        p_current_date
      );
      RAISE NOTICE 'Added protocol to archived_protocols';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'Protocol already archived';
    END;
  ELSE
    RAISE NOTICE 'Not all required signatures present. Required: %, Current: %', 
      v_required_signers, v_current_signers;
  END IF;
END;
$$ LANGUAGE plpgsql; 