DROP FUNCTION IF EXISTS sign_and_complete_protocol(UUID, UUID, TIMESTAMPTZ);

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
  -- Initial debug logging
  RAISE LOG '[DEBUG] sign_and_complete_protocol: Function called with parameters:';
  RAISE LOG '[DEBUG] - protocol_id: %', p_protocol_id;
  RAISE LOG '[DEBUG] - user_id: %', p_user_id;
  RAISE LOG '[DEBUG] - current_date: %', p_current_date;

  -- Get protocol details
  RAISE LOG '[DEBUG] Attempting to fetch protocol details for ID: %', p_protocol_id;
  SELECT * INTO v_protocol
  FROM protocols
  WHERE id = p_protocol_id;

  -- Log protocol fetch result
  IF v_protocol IS NULL THEN
    RAISE LOG '[ERROR] Protocol not found with ID=%', p_protocol_id;
    RAISE EXCEPTION 'Protocol not found with ID: %', p_protocol_id;
  ELSE
    RAISE LOG '[DEBUG] Protocol found:';
    RAISE LOG '[DEBUG] - tender_id: %', v_protocol.tender_id;
    RAISE LOG '[DEBUG] - request_id: %', v_protocol.request_id;
    RAISE LOG '[DEBUG] - status: %', v_protocol.status;
    RAISE LOG '[DEBUG] - type: %', v_protocol.type;
  END IF;

  v_tender_id := v_protocol.tender_id;
  v_request_id := v_protocol.request_id;

  -- Determine protocol type with detailed logging
  RAISE LOG '[DEBUG] Starting protocol type determination';
  IF v_protocol.type IS NOT NULL THEN
    RAISE LOG '[DEBUG] Using existing protocol type: %', v_protocol.type;
    v_protocol_type := v_protocol.type;
  ELSE
    RAISE LOG '[DEBUG] Protocol type is NULL, determining type based on IDs:';
    RAISE LOG '[DEBUG] - tender_id present: %', (v_tender_id IS NOT NULL);
    RAISE LOG '[DEBUG] - request_id present: %', (v_request_id IS NOT NULL);
    
    v_protocol_type := CASE
      WHEN v_tender_id IS NOT NULL THEN 'tender'
      WHEN v_request_id IS NOT NULL THEN 'cash'
      ELSE 'tender' -- Default to tender if neither is present
    END;
    
    RAISE LOG '[DEBUG] Determined protocol type: %', v_protocol_type;
    
    -- Update the protocol type if it wasn't set
    RAISE LOG '[DEBUG] Updating protocol with determined type';
    UPDATE protocols
    SET type = v_protocol_type
    WHERE id = p_protocol_id;
    
    -- Verify the update
    RAISE LOG '[DEBUG] Verifying protocol type update';
    SELECT type INTO STRICT v_protocol_type
    FROM protocols
    WHERE id = p_protocol_id;
    RAISE LOG '[DEBUG] Verified protocol type after update: %', v_protocol_type;
  END IF;

  -- Get request number with logging
  RAISE LOG '[DEBUG] Fetching request number';
  SELECT r.number INTO v_request_number
  FROM protocols p
  LEFT JOIN requests r ON r.id = COALESCE(p.request_id, 
    (SELECT request_id FROM tenders WHERE id = p.tender_id))
  WHERE p.id = p_protocol_id;
  RAISE LOG '[DEBUG] Request number found: %', COALESCE(v_request_number, 'NULL');

  -- Add the signature with detailed logging
  BEGIN
    RAISE LOG '[DEBUG] Attempting to insert signature with following values:';
    RAISE LOG '[DEBUG] - protocol_id: %', p_protocol_id;
    RAISE LOG '[DEBUG] - user_id: %', p_user_id;
    RAISE LOG '[DEBUG] - date: %', p_current_date;
    RAISE LOG '[DEBUG] - type: %', v_protocol_type;

    -- Verify protocol_signatures table structure
    RAISE LOG '[DEBUG] Verifying protocol_signatures table columns';
    PERFORM column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'protocol_signatures';

    INSERT INTO protocol_signatures (
      protocol_id,
      user_id,
      date,
      type
    ) VALUES (
      p_protocol_id,
      p_user_id,
      p_current_date,
      v_protocol_type
    );
    
    RAISE LOG '[DEBUG] Successfully inserted signature';
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG '[DEBUG] Signature already exists, attempting update';
      -- Update existing signature type if it's incorrect
      UPDATE protocol_signatures
      SET type = v_protocol_type
      WHERE protocol_id = p_protocol_id AND user_id = p_user_id;
      RAISE LOG '[DEBUG] Updated existing signature type';
    WHEN OTHERS THEN
      RAISE LOG '[ERROR] Unexpected error during signature insertion/update:';
      RAISE LOG '[ERROR] - SQLSTATE: %', SQLSTATE;
      RAISE LOG '[ERROR] - SQLERRM: %', SQLERRM;
      RAISE;
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

  RAISE LOG 'sign_and_complete_protocol: Required signers for type=% are: %', v_protocol_type, v_required_signers;

  -- Get current signers (handle NULL case)
  WITH current_sigs AS (
    SELECT ARRAY_AGG(user_id) as sigs
    FROM protocol_signatures
    WHERE protocol_id = p_protocol_id
  )
  SELECT COALESCE(sigs, ARRAY[]::UUID[]) INTO v_current_signers
  FROM current_sigs;

  RAISE LOG 'sign_and_complete_protocol: Current signers are: %', v_current_signers;

  -- Check if all required signatures are present
  IF v_current_signers @> v_required_signers THEN
    RAISE LOG 'sign_and_complete_protocol: All required signatures present, proceeding with completion';
    
    -- Update protocol status to completed and set finance status
    UPDATE protocols
    SET 
      status = 'completed',
      finance_status = 'not_submitted'
    WHERE id = p_protocol_id;

    RAISE LOG 'sign_and_complete_protocol: Updated protocol status to completed and set finance_status for protocol_id=%', p_protocol_id;

    -- Add to archived_protocols
    BEGIN
      INSERT INTO archived_protocols (
        protocol_id,
        created_at
      ) VALUES (
        p_protocol_id,
        p_current_date
      );
      RAISE LOG 'sign_and_complete_protocol: Successfully archived protocol_id=%', p_protocol_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE LOG 'sign_and_complete_protocol: Protocol already archived - protocol_id=%', p_protocol_id;
    END;
  ELSE
    RAISE LOG 'sign_and_complete_protocol: Not all required signatures present. Required: %, Current: %', 
      v_required_signers, v_current_signers;
  END IF;

  RAISE LOG 'sign_and_complete_protocol: Completed execution for protocol_id=% and user_id=%', 
    p_protocol_id, p_user_id;
END;
$$ LANGUAGE plpgsql; 