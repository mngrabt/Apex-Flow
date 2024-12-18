-- Create debug_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    function_name TEXT,
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to safely log debug information
CREATE OR REPLACE FUNCTION safe_debug_log(
    p_function_name TEXT,
    p_message TEXT,
    p_details JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
    -- Try to insert into debug_logs if the table exists
    BEGIN
        INSERT INTO debug_logs (function_name, message, details)
        VALUES (p_function_name, p_message, p_details);
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, silently continue
        NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE debug_logs TO authenticated;
GRANT EXECUTE ON FUNCTION safe_debug_log TO authenticated;

-- Update the create_cash_protocol function to use safe logging
CREATE OR REPLACE FUNCTION create_cash_protocol(
  p_request_id UUID,
  p_current_date TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_protocol_id UUID;
  v_request_number TEXT;
  v_department TEXT;
BEGIN
  -- Log the start of protocol creation
  PERFORM safe_debug_log('create_cash_protocol', 'Starting cash protocol creation', jsonb_build_object('request_id', p_request_id));

  -- Get request number and department
  SELECT number, department INTO v_request_number, v_department
  FROM requests
  WHERE id = p_request_id;

  -- Log request details
  PERFORM safe_debug_log('create_cash_protocol', 'Retrieved request details', jsonb_build_object(
    'request_number', v_request_number,
    'department', v_department
  ));

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

  -- Log protocol creation
  PERFORM safe_debug_log('create_cash_protocol', 'Created new protocol', jsonb_build_object(
    'protocol_id', v_protocol_id,
    'request_id', p_request_id
  ));

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

  -- Log signature addition
  PERFORM safe_debug_log('create_cash_protocol', 'Added initial signature', jsonb_build_object(
    'protocol_id', v_protocol_id,
    'user_id', '00000000-0000-0000-0000-000000000001'
  ));

  -- Return the protocol ID for frontend notification handling
  RETURN v_protocol_id;
END;
$$ LANGUAGE plpgsql; 