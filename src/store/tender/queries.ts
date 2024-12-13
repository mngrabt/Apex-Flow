import { supabase } from '../../lib/supabase';

export async function selectWinnersQuery(
  tenderId: string,
  winnerId: string,
  winnerReason: string,
  reserveId: string,
  reserveReason: string
) {
  const { error } = await supabase.rpc(
    'select_winner_and_create_protocol',
    {
      p_tender_id: tenderId,
      p_supplier_id: winnerId,
      p_reserve_supplier_id: reserveId,
      p_reason: winnerReason,
      p_reserve_reason: reserveReason,
      p_current_date: new Date().toISOString()
    }
  );

  if (error) {
    console.error('Error in selectWinnersQuery:', error);
    throw error;
  }
}

export async function fetchTendersQuery() {
  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      suppliers:suppliers!suppliers_tender_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error in fetchTendersQuery:', error);
    throw error;
  }

  return data;
}