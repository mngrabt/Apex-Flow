-- Drop existing trigger functions if they exist
DROP FUNCTION IF EXISTS auto_sign_protocol() CASCADE;
DROP FUNCTION IF EXISTS check_protocol_completion() CASCADE;
DROP FUNCTION IF EXISTS handle_protocol_signature() CASCADE;

-- Recreate auto_sign_protocol with type field
CREATE OR REPLACE FUNCTION auto_sign_protocol()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO protocol_signatures (
    protocol_id,
    user_id,
    date,
    type
  ) VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NEW.type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update create_cash_protocol function to include type
CREATE OR REPLACE FUNCTION create_cash_protocol(
  p_request_id UUID,
  p_current_date TIMESTAMPTZ
)
RETURNS UUID AS $$
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

  -- Add Abdurauf's signature automatically with type
  INSERT INTO protocol_signatures (
    protocol_id,
    user_id,
    date,
    type
  ) VALUES (
    v_protocol_id,
    '00000000-0000-0000-0000-000000000001',
    p_current_date,
    'cash'
  );

  -- Return the protocol ID for frontend notification handling
  RETURN v_protocol_id;
END;
$$ LANGUAGE plpgsql;

-- Update select_winner_and_create_protocol function to include type
CREATE OR REPLACE FUNCTION select_winner_and_create_protocol(
  p_tender_id UUID,
  p_supplier_id UUID,
  p_reason TEXT,
  p_reserve_supplier_id UUID,
  p_reserve_reason TEXT,
  p_current_date TIMESTAMPTZ
)
RETURNS void AS $$
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

  -- Add Abdurauf's signature automatically with type
  INSERT INTO protocol_signatures (
    protocol_id,
    user_id,
    date,
    type
  ) VALUES (
    v_protocol_id,
    '00000000-0000-0000-0000-000000000001',
    p_current_date,
    'tender'
  );
END;
$$ LANGUAGE plpgsql; 