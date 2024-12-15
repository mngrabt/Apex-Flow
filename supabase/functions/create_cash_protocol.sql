-- Drop the existing function first
DROP FUNCTION IF EXISTS create_cash_protocol(UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION create_cash_protocol(
  p_request_id UUID,
  p_current_date TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_protocol_id UUID;
  v_request_number TEXT;
  v_department TEXT;
BEGIN
  -- Get request number and department
  SELECT number, department INTO v_request_number, v_department
  FROM requests
  WHERE id = p_request_id;

  -- Update request status to protocol
  UPDATE requests 
  SET status = 'protocol'
  WHERE id = p_request_id;

  -- Create protocol
  INSERT INTO protocols (
    id,
    request_id,
    type,
    status,
    finance_status,
    department,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_request_id,
    'cash',
    'pending',
    'not_submitted',
    v_department,
    p_current_date
  )
  RETURNING id INTO v_protocol_id;

  -- Add Abdurauf's signature automatically
  INSERT INTO protocol_signatures (
    protocol_id,
    user_id,
    date
  ) VALUES (
    v_protocol_id,
    '00000000-0000-0000-0000-000000000001',
    p_current_date
  );

  -- Return the protocol ID for frontend notification handling
  RETURN v_protocol_id;
END;
$$ LANGUAGE plpgsql; 