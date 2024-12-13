-- Create function to update supplier statistics
CREATE OR REPLACE FUNCTION update_supplier_stats()
RETURNS TRIGGER AS $$
DECLARE
  supplier_record RECORD;
BEGIN
  -- When a tender is completed or a supplier is added
  IF (TG_OP = 'UPDATE') THEN
    -- Log the tender update
    RAISE NOTICE 'Processing tender stats for tender %', NEW.id;
    
    -- Get all affected suppliers for this tender
    FOR supplier_record IN 
      SELECT DISTINCT ds.id, ds.name
      FROM database_suppliers ds
      JOIN suppliers s ON LOWER(TRIM(s.company_name)) = LOWER(TRIM(ds.name))
      WHERE s.tender_id = NEW.id
    LOOP
      -- Update tender_count for this supplier
      UPDATE database_suppliers ds
      SET tender_count = (
        SELECT COUNT(DISTINCT t.id)
        FROM suppliers s
        JOIN tenders t ON t.id = s.tender_id
        WHERE LOWER(TRIM(s.company_name)) = LOWER(TRIM(ds.name))
      )
      WHERE ds.id = supplier_record.id;

      -- Update won_tender_count for this supplier
      UPDATE database_suppliers ds
      SET won_tender_count = (
        SELECT COUNT(DISTINCT t.id)
        FROM suppliers s
        JOIN tenders t ON t.id = s.tender_id
        WHERE LOWER(TRIM(s.company_name)) = LOWER(TRIM(ds.name))
          AND t.status = 'completed'
          AND t.winner_id = s.id
      )
      WHERE ds.id = supplier_record.id;

      -- Log the update
      RAISE NOTICE 'Updated stats for supplier % (%)', 
        supplier_record.name, supplier_record.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_supplier_stats_trigger ON tenders;
CREATE TRIGGER update_supplier_stats_trigger
  AFTER UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_stats();

-- Create trigger for supplier changes
CREATE OR REPLACE FUNCTION update_supplier_stats_on_supplier_change()
RETURNS TRIGGER AS $$
DECLARE
  affected_supplier_id UUID;
BEGIN
  -- Find the affected database supplier
  SELECT ds.id INTO affected_supplier_id
  FROM database_suppliers ds
  WHERE LOWER(TRIM(ds.name)) = LOWER(TRIM(COALESCE(NEW.company_name, OLD.company_name)));

  IF affected_supplier_id IS NOT NULL THEN
    -- Update tender_count for the affected supplier
    UPDATE database_suppliers ds
    SET tender_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM suppliers s
      JOIN tenders t ON t.id = s.tender_id
      WHERE LOWER(TRIM(s.company_name)) = LOWER(TRIM(ds.name))
    )
    WHERE ds.id = affected_supplier_id;

    -- Update won_tender_count for the affected supplier
    UPDATE database_suppliers ds
    SET won_tender_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM suppliers s
      JOIN tenders t ON t.id = s.tender_id
      WHERE LOWER(TRIM(s.company_name)) = LOWER(TRIM(ds.name))
        AND t.status = 'completed'
        AND t.winner_id = s.id
    )
    WHERE ds.id = affected_supplier_id;

    RAISE NOTICE 'Updated stats for supplier ID: %', affected_supplier_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supplier changes
DROP TRIGGER IF EXISTS update_supplier_stats_on_supplier_change_trigger ON suppliers;
CREATE TRIGGER update_supplier_stats_on_supplier_change_trigger
  AFTER INSERT OR DELETE OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_stats_on_supplier_change(); 