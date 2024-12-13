CREATE OR REPLACE FUNCTION select_winner_and_create_protocol(
  p_tender_id UUID,
  p_supplier_id UUID,
  p_reserve_supplier_id UUID,
  p_reason TEXT,
  p_reserve_reason TEXT,
  p_current_date TIMESTAMPTZ
) RETURNS void AS $$
DECLARE
  v_request_id UUID;
  v_request_name TEXT;
  v_protocol_id UUID;
BEGIN
  -- Get request ID and name
  SELECT r.id, ri.name INTO v_request_id, v_request_name
  FROM tenders t
  JOIN requests r ON r.id = t.request_id
  JOIN request_items ri ON ri.request_id = r.id
  WHERE t.id = p_tender_id
  LIMIT 1;

  -- Update tender
  UPDATE tenders 
  SET 
    winner_id = p_supplier_id,
    winner_reason = p_reason,
    reserve_winner_id = p_reserve_supplier_id,
    reserve_winner_reason = p_reserve_reason,
    status = 'completed'
  WHERE id = p_tender_id;

  -- Create protocol
  INSERT INTO protocols (
    id,
    tender_id,
    type,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_tender_id,
    'tender',
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