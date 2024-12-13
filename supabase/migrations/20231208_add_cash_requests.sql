-- Add type column to requests table
ALTER TABLE requests ADD COLUMN type text NOT NULL DEFAULT 'transfer';

-- Add amount and total_sum columns to request_items table
ALTER TABLE request_items ADD COLUMN amount numeric;
ALTER TABLE request_items ADD COLUMN total_sum numeric;

-- Create a function to handle cash request workflow
CREATE OR REPLACE FUNCTION process_cash_request()
RETURNS trigger AS $$
BEGIN
  -- If it's a cash request and has all required signatures
  IF NEW.type = 'cash' AND (
    SELECT COUNT(DISTINCT user_id) = 3
    FROM request_signatures
    WHERE request_id = NEW.id
    AND user_id IN (
      '00000000-0000-0000-0000-000000000001', -- Abdurauf
      '00000000-0000-0000-0000-000000000003', -- Fozil
      '00000000-0000-0000-0000-000000000004'  -- Aziz
    )
  ) THEN
    -- Set the date when all signatures are collected
    UPDATE requests
    SET date = NOW()
    WHERE id = NEW.id;
    
    -- Skip tender and protocol stages by setting status to approved
    UPDATE requests
    SET status = 'approved'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash request workflow
CREATE TRIGGER cash_request_workflow
AFTER INSERT OR UPDATE ON request_signatures
FOR EACH ROW
EXECUTE FUNCTION process_cash_request(); 