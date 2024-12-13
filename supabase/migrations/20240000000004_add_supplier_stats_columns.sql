-- Add tender statistics columns if they don't exist
DO $$ 
BEGIN
  -- Add tender_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'database_suppliers' 
    AND column_name = 'tender_count'
  ) THEN
    ALTER TABLE database_suppliers 
    ADD COLUMN tender_count INTEGER DEFAULT 0;
  END IF;

  -- Add won_tender_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'database_suppliers' 
    AND column_name = 'won_tender_count'
  ) THEN
    ALTER TABLE database_suppliers 
    ADD COLUMN won_tender_count INTEGER DEFAULT 0;
  END IF;
END $$; 