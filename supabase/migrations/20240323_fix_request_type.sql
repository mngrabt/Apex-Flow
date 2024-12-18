-- Add default value for type column
ALTER TABLE requests 
ALTER COLUMN type SET DEFAULT 'transfer';