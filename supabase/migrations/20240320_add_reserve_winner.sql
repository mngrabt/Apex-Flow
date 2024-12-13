-- Add reserve winner columns to tenders table
ALTER TABLE tenders
ADD COLUMN reserve_winner_id UUID,
ADD COLUMN reserve_winner_reason TEXT;

-- Add foreign key constraints
ALTER TABLE tenders
ADD CONSTRAINT fk_winner_id FOREIGN KEY (winner_id) REFERENCES suppliers(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_reserve_winner_id FOREIGN KEY (reserve_winner_id) REFERENCES suppliers(id) ON DELETE SET NULL; 