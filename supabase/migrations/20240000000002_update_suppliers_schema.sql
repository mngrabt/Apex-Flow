-- First, remove the foreign key constraints from tenders table
ALTER TABLE tenders
DROP CONSTRAINT IF EXISTS fk_tenders_winner,
DROP CONSTRAINT IF EXISTS fk_tenders_reserve_winner;

-- Temporarily set existing winner references to NULL
UPDATE tenders
SET winner_id = NULL,
    reserve_winner_id = NULL;

-- Drop existing table if it exists
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create suppliers table
CREATE TABLE suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    contact_person text NOT NULL,
    contact_number text NOT NULL,
    delivery_time integer NOT NULL,
    price_per_unit numeric NOT NULL,
    price numeric NOT NULL,
    include_tax boolean DEFAULT false NOT NULL,
    proposal_url text,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    -- Add unique constraint to prevent multiple offers from same supplier
    UNIQUE (tender_id, created_by)
);

-- Add indexes for better performance
CREATE INDEX suppliers_tender_id_idx ON suppliers(tender_id);
CREATE INDEX suppliers_created_by_idx ON suppliers(created_by);

-- Recreate the foreign key constraints on tenders table
ALTER TABLE tenders
ADD CONSTRAINT fk_tenders_winner 
    FOREIGN KEY (winner_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL,
ADD CONSTRAINT fk_tenders_reserve_winner 
    FOREIGN KEY (reserve_winner_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL; 