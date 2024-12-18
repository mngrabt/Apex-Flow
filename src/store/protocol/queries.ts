import { supabase } from '../../lib/supabase';
import { sendNotification } from '../../services/notificationService';

// Constants for user IDs
const ABDURAUF_ID = '00000000-0000-0000-0000-000000000001';

export async function createProtocolFromTender(tenderId: string) {
  try {
    // Start a transaction
    const { data: protocol, error: protocolError } = await supabase
      .rpc('create_protocol_from_tender', {
        p_tender_id: tenderId,
        p_current_date: new Date().toISOString()
      });

    if (protocolError) {
      console.error('Error creating protocol:', protocolError);
      throw protocolError;
    }

    if (!protocol?.id) {
      throw new Error('Protocol ID not returned from creation');
    }

    console.log('Created protocol:', protocol);

    // Automatically add Abdurauf's signature since he approved the tender
    const { error: signatureError } = await supabase
      .from('protocol_signatures')
      .insert({
        protocol_id: protocol.id,
        user_id: ABDURAUF_ID,
        date: new Date().toISOString()
      });

    if (signatureError) {
      console.error('Error adding signature:', signatureError);
      throw signatureError;
    }

    console.log('Added Abdurauf signature to protocol:', protocol.id);

    // Send notification about protocol needing signature
    const { data: protocolDetails } = await supabase
      .from('protocols')
      .select(`
        *,
        tender:tenders(
          request:requests(
            items:request_items(*),
            department
          )
        )
      `)
      .eq('id', protocol.id)
      .single();

    if (protocolDetails) {
      await sendNotification('PROTOCOL_NEEDS_SIGNATURE', {
        name: protocolDetails.tender?.request?.items?.[0]?.name || `Протокол #${protocol.id}`,
        protocolId: protocol.id,
        type: 'tender',
        department: protocolDetails.tender?.request?.department,
        tenderId: protocolDetails.tender_id
      });
    }

    return protocol;
  } catch (error) {
    console.error('Error in createProtocolFromTender:', error);
    throw error;
  }
}

export async function fetchProtocolsQuery() {
  const { data, error } = await supabase
    .from('protocols')
    .select(`
      *,
      signatures:protocol_signatures(
        user_id,
        date
      ),
      request:requests!protocols_request_id_fkey!inner(
        id,
        number,
        date,
        department,
        status,
        created_at,
        created_by,
        document_url,
        categories,
        request_signatures!requests_id_fkey(
          user_id,
          date
        ),
        items:request_items(
          id,
          name,
          description,
          quantity,
          total_sum
        )
      )
    `)
    .neq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  console.log('Fetched protocols with signatures:', data?.map(p => ({
    id: p.id,
    type: p.type,
    protocol_signatures: p.signatures,
    request_signatures: p.request?.request_signatures
  })));
  
  return data;
}

export async function fetchCompletedProtocolsQuery() {
  const { data, error } = await supabase
    .from('protocols')
    .select(`
      *,
      signatures:protocol_signatures(
        user_id,
        date
      ),
      request:requests!protocols_request_id_fkey!inner(
        id,
        number,
        date,
        department,
        status,
        created_at,
        created_by,
        document_url,
        categories,
        request_signatures!requests_id_fkey(
          user_id,
          date
        ),
        items:request_items(
          id,
          name,
          description,
          quantity,
          total_sum
        )
      )
    `)
    .or(`type.eq.cash,and(status.eq.completed)`)
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

export async function signCashRequestQuery(protocolId: string, requestId: string, userId: string, currentDate: string) {
  try {
    // First sign the protocol
    const { error: protocolError } = await supabase
      .from('protocol_signatures')
      .insert({
        protocol_id: protocolId,
        user_id: userId,
        date: currentDate,
        type: 'cash'
      });

    if (protocolError) {
      console.error('Error signing protocol:', protocolError);
      throw protocolError;
    }

    // Then sign the request
    const { error: requestError } = await supabase
      .from('request_signatures')
      .insert({
        request_id: requestId,
        user_id: userId,
        date: currentDate
      });

    if (requestError) {
      console.error('Error signing request:', requestError);
      throw requestError;
    }

    // Get protocol with all signatures to check if it's complete
    const { data: protocol } = await supabase
      .from('protocols')
      .select(`
        *,
        signatures:protocol_signatures(
          user_id,
          date
        ),
        request:requests(
          department,
          number,
          items:request_items(
            name
          )
        )
      `)
      .eq('id', protocolId)
      .single();

    if (protocol) {
      // Required signers for cash protocols
      const requiredSigners = [
        '00000000-0000-0000-0000-000000000001', // Abdurauf
        '00000000-0000-0000-0000-000000000003', // Fozil
        '00000000-0000-0000-0000-000000000004'  // Aziz
      ];

      // Check if all required signatures are present
      const hasAllSignatures = requiredSigners.every(signerId => 
        protocol.signatures?.some(sig => sig.user_id === signerId)
      );

      if (hasAllSignatures) {
        // Update protocol status to completed
        const { error: updateError } = await supabase
          .from('protocols')
          .update({ 
            status: 'completed',
            completed_at: currentDate,
            finance_status: 'not_submitted'
          })
          .eq('id', protocolId);

        if (updateError) {
          console.error('Error updating protocol status:', updateError);
          throw updateError;
        }

        // Add to archived_protocols only when all signatures are collected
        const { error: archiveError } = await supabase
          .from('archived_protocols')
          .insert({
            protocol_id: protocolId,
            created_at: currentDate
          });

        if (archiveError && !archiveError.message.includes('duplicate')) {
          console.error('Error archiving protocol:', archiveError);
          throw archiveError;
        }

        // Send notification about protocol needing a number
        await sendNotification('PROTOCOL_NEEDS_NUMBER', {
          name: protocol.request?.items?.[0]?.name || `Протокол #${protocolId}`,
          type: protocol.type || 'cash',
          department: protocol.department || protocol.request?.department,
          requestNumber: protocol.request?.number
        });
      }
    }
  } catch (error) {
    console.error('Error in signCashRequestQuery:', error);
    throw error;
  }
}

export async function signProtocolQuery(protocolId: string, userId: string, currentDate: string) {
  console.log('Starting protocol signing process:', {
    protocolId,
    userId,
    currentDate
  });

  try {
    // Get initial protocol state
    const { data: initialProtocol, error: initialError } = await supabase
      .from('protocols')
      .select(`
        *,
        signatures:protocol_signatures(user_id, date)
      `)
      .eq('id', protocolId)
      .single();

    if (initialError) {
      console.error('Error fetching initial protocol state:', initialError);
      throw initialError;
    }

    if (!initialProtocol) {
      console.error('Protocol not found:', protocolId);
      throw new Error('Protocol not found');
    }

    // Check if user has already signed
    if (initialProtocol.signatures?.some(sig => sig.user_id === userId)) {
      console.log('User has already signed this protocol');
      return;
    }

    // Add signature with minimal required fields
    const { error: signatureError } = await supabase
      .from('protocol_signatures')
      .insert({
        protocol_id: protocolId,
        user_id: userId,
        date: currentDate,
        type: initialProtocol.type || 'tender'
      });

    if (signatureError) {
      console.error('Error adding signature:', signatureError);
      throw signatureError;
    }

    // Get protocol with all signatures to check if it's complete
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select(`
        *,
        signatures:protocol_signatures(
          user_id,
          date
        ),
        request:requests(
          department,
          number,
          items:request_items(
            name
          )
        )
      `)
      .eq('id', protocolId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated protocol:', fetchError);
      throw fetchError;
    }

    if (!protocol) {
      console.error('Updated protocol not found:', protocolId);
      throw new Error('Updated protocol not found');
    }

    // Required signers for regular protocols
    const requiredSigners = [
      '00000000-0000-0000-0000-000000000001', // Abdurauf
      '00000000-0000-0000-0000-000000000003', // Fozil
      '00000000-0000-0000-0000-000000000004', // Aziz
      '00000000-0000-0000-0000-000000000005'  // Umarali
    ];

    // Check if all required signatures are present
    const hasAllSignatures = requiredSigners.every(signerId => 
      protocol.signatures?.some(sig => sig.user_id === signerId)
    );

    if (hasAllSignatures) {
      // Update protocol status to completed
      const { error: updateError } = await supabase
        .from('protocols')
        .update({ 
          status: 'completed',
          completed_at: currentDate,
          finance_status: 'not_submitted'
        })
        .eq('id', protocolId);

      if (updateError) {
        console.error('Error updating protocol status:', updateError);
        throw updateError;
      }

      // Add to archived_protocols only when all signatures are collected
      const { error: archiveError } = await supabase
        .from('archived_protocols')
        .insert({
          protocol_id: protocolId,
          created_at: currentDate
        });

      if (archiveError && !archiveError.message.includes('duplicate')) {
        console.error('Error archiving protocol:', archiveError);
        throw archiveError;
      }

      // Send notification about protocol needing a number
      await sendNotification('PROTOCOL_NEEDS_NUMBER', {
        name: protocol.request?.items?.[0]?.name || `Протокол #${protocolId}`,
        type: protocol.type || 'tender',
        department: protocol.department || protocol.request?.department,
        requestNumber: protocol.request?.number
      });
    }
  } catch (error) {
    console.error('Error in signProtocolQuery:', error);
    throw error;
  }
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