CREATE OR REPLACE FUNCTION create_cash_protocol(
  p_request_id UUID,
  p_current_date TIMESTAMPTZ
) RETURNS void AS $$
DECLARE
  v_protocol_id UUID;
BEGIN
  -- Create protocol
  INSERT INTO protocols (
    id,
    request_id,
    type,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_request_id,
    'cash',
    'pending',
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
END;
$$ LANGUAGE plpgsql; 