-- Make zip_url nullable in archived_protocols table
ALTER TABLE archived_protocols
ALTER COLUMN zip_url DROP NOT NULL;

-- Add index on protocol_id for better performance
CREATE INDEX IF NOT EXISTS archived_protocols_protocol_id_idx ON archived_protocols(protocol_id);

-- Add trigger to prevent duplicate archives
CREATE OR REPLACE FUNCTION prevent_duplicate_archives()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM archived_protocols 
        WHERE protocol_id = NEW.protocol_id 
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Protocol % is already archived', NEW.protocol_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_archives_trigger
    BEFORE INSERT OR UPDATE ON archived_protocols
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_archives(); 