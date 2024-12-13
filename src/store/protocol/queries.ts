import { supabase } from '../../lib/supabase';

export async function fetchProtocolsQuery() {
  const { data, error } = await supabase
    .from('protocols')
    .select(`
      id,
      tender_id,
      request_id,
      type,
      status,
      finance_status,
      urgency,
      submitted_at,
      paid_at,
      created_at,
      number,
      department,
      signatures:protocol_signatures(
        user_id,
        date
      ),
      tender:tenders!protocols_tender_id_fkey(
        id,
        request_id,
        status,
        winner_id,
        winner_reason,
        created_at,
        suppliers:suppliers!suppliers_tender_id_fkey(
          id,
          company_name,
          contact_person,
          contact_number,
          delivery_time,
          price_per_unit,
          price,
          include_tax,
          proposal_url,
          created_by,
          created_at
        ),
        request:requests!tenders_request_id_fkey(
          id,
          number,
          date,
          department,
          document_url,
          status,
          created_at,
          created_by,
          categories,
          items:request_items(
            id,
            name,
            description,
            object_type,
            unit_type,
            quantity,
            deadline
          )
        )
      ),
      request:requests!protocols_request_id_fkey(
        id,
        number,
        date,
        department,
        status,
        created_at,
        created_by,
        categories,
        items:request_items(
          id,
          name,
          description,
          quantity,
          total_sum
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchProtocolDetails(protocolId: string) {
  const { data, error } = await supabase
    .from('protocols')
    .select(`
      id,
      tender_id,
      request_id,
      type,
      status,
      finance_status,
      urgency,
      submitted_at,
      paid_at,
      created_at,
      number,
      department,
      items,
      total_sum,
      signatures:protocol_signatures(
        user_id,
        date
      ),
      tender:tenders!protocols_tender_id_fkey(
        id,
        request_id,
        status,
        winner_id,
        winner_reason,
        created_at,
        suppliers:suppliers!suppliers_tender_id_fkey(
          id,
          company_name,
          contact_person,
          contact_number,
          delivery_time,
          price_per_unit,
          price,
          include_tax,
          proposal_url,
          created_by,
          created_at
        ),
        request:requests!tenders_request_id_fkey(
          id,
          number,
          date,
          department,
          document_url,
          status,
          created_at,
          created_by,
          categories,
          items:request_items(
            id,
            name,
            description,
            object_type,
            unit_type,
            quantity,
            deadline
          )
        )
      ),
      request:requests!protocols_request_id_fkey(
        id,
        number,
        date,
        department,
        status,
        created_at,
        created_by,
        categories,
        items:request_items(
          id,
          name,
          description,
          quantity
        )
      )
    `)
    .eq('id', protocolId)
    .single();

  if (error) throw error;
  return data;
}

export async function signProtocolQuery(protocolId: string, userId: string, currentDate: string) {
  const { error } = await supabase.rpc('sign_and_complete_protocol', {
    p_protocol_id: protocolId,
    p_user_id: userId,
    p_current_date: currentDate
  });

  if (error) throw error;
}

export async function submitProtocolQuery(protocolId: string, urgency: 'high' | 'low') {
  const { error } = await supabase.rpc('submit_protocol', {
    p_protocol_id: protocolId,
    p_urgency: urgency,
    p_current_date: new Date().toISOString()
  });

  if (error) throw error;
}

export async function markAsPaidQuery(protocolId: string) {
  const { error } = await supabase.rpc('mark_protocol_as_paid', {
    p_protocol_id: protocolId,
    p_current_date: new Date().toISOString()
  });

  if (error) throw error;
}
</```
rewritten_file>