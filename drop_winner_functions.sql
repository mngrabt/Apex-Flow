-- Drop winner selection functions
DROP FUNCTION IF EXISTS public.select_winner_and_create_protocol;
DROP FUNCTION IF EXISTS public.auto_select_winner;

-- Remove winner-related columns from tenders table
ALTER TABLE public.tenders 
DROP COLUMN IF EXISTS winner_id,
DROP COLUMN IF EXISTS winner_reason,
DROP COLUMN IF EXISTS reserve_winner_id,
DROP COLUMN IF EXISTS reserve_winner_reason; 