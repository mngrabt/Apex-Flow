import { supabase } from '../lib/supabase';
import { useRequestStore } from '../store/request';
import { useTenderStore } from '../store/tender';
import { useProtocolStore } from '../store/protocol';
import { useArchiveStore } from '../store/archive';
import { generateProtocolDocument } from './documentGenerator';
import { generateRequestDocument } from './documentGenerator';
import { uploadDocument } from '../lib/storage';

export async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Get all data from Zustand stores
    const requests = useRequestStore.getState().requests;
    const tenders = useTenderStore.getState().tenders;
    const protocols = useProtocolStore.getState().protocols;
    const archivedProtocols = useArchiveStore.getState().archivedProtocols;

    // 1. Migrate Requests and Items
    console.log('Migrating requests...');
    for (const request of requests) {
      // Insert request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          id: request.id,
          number: request.number,
          date: request.date,
          department: request.department,
          status: request.status,
          created_at: request.createdAt,
          created_by: request.createdBy
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error inserting request:', requestError);
        continue;
      }

      // Insert request items
      for (const item of request.items) {
        const { error: itemError } = await supabase
          .from('request_items')
          .insert({
            id: item.id,
            request_id: request.id,
            name: item.name,
            description: item.description,
            object_type: item.objectType,
            unit_type: item.unitType,
            quantity: item.quantity,
            deadline: item.deadline
          });

        if (itemError) {
          console.error('Error inserting request item:', itemError);
        }
      }

      // Insert request signatures
      for (const signature of request.signatures) {
        const { error: signatureError } = await supabase
          .from('request_signatures')
          .insert({
            request_id: request.id,
            user_id: signature.userId,
            date: signature.date
          });

        if (signatureError) {
          console.error('Error inserting request signature:', signatureError);
        }
      }
    }

    // 2. Migrate Tenders and Suppliers
    console.log('Migrating tenders...');
    for (const tender of tenders) {
      // Insert tender
      const { data: tenderData, error: tenderError } = await supabase
        .from('tenders')
        .insert({
          id: tender.id,
          request_id: tender.requestId,
          status: tender.status,
          winner_id: tender.winnerId,
          winner_reason: tender.winnerReason,
          created_at: tender.createdAt
        })
        .select()
        .single();

      if (tenderError) {
        console.error('Error inserting tender:', tenderError);
        continue;
      }

      // Insert suppliers
      for (const supplier of tender.suppliers) {
        // First, upload the proposal document if it exists
        let proposalUrl = null;
        if (supplier.proposalDocument) {
          try {
            proposalUrl = await uploadDocument(
              supplier.proposalDocument,
              tender.id,
              'commercial'
            );
          } catch (error) {
            console.error('Error uploading proposal document:', error);
          }
        }

        const { error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            id: supplier.id,
            tender_id: tender.id,
            company_name: supplier.companyName,
            contact_person: supplier.contactPerson,
            contact_number: supplier.contactNumber,
            delivery_time: supplier.deliveryTime,
            price: supplier.price,
            price_per_unit: supplier.pricePerUnit,
            include_tax: supplier.includeTax,
            proposal_url: proposalUrl,
            created_by: supplier.createdBy
          });

        if (supplierError) {
          console.error('Error inserting supplier:', supplierError);
        }
      }
    }

    // 3. Migrate Active Protocols
    console.log('Migrating active protocols...');
    for (const protocol of protocols) {
      // Insert protocol
      const { data: protocolData, error: protocolError } = await supabase
        .from('protocols')
        .insert({
          id: protocol.id,
          tender_id: protocol.tenderId,
          status: protocol.status,
          created_at: protocol.createdAt
        })
        .select()
        .single();

      if (protocolError) {
        console.error('Error inserting protocol:', protocolError);
        continue;
      }

      // Insert protocol signatures
      for (const signature of protocol.signatures) {
        const { error: signatureError } = await supabase
          .from('protocol_signatures')
          .insert({
            protocol_id: protocol.id,
            user_id: signature.userId,
            date: signature.date
          });

        if (signatureError) {
          console.error('Error inserting protocol signature:', signatureError);
        }
      }
    }

    // 4. Migrate Archived Protocols
    console.log('Migrating archived protocols...');
    for (const archived of archivedProtocols) {
      // First, generate and upload all required documents
      const tender = tenders.find(t => t.id === archived.tenderId);
      const request = requests.find(r => r.id === tender?.requestId);

      if (!tender || !request) {
        console.error('Missing tender or request for archived protocol:', archived.id);
        continue;
      }

      // Generate protocol document
      const protocolDoc = generateProtocolDocument(archived, tender, request);
      const protocolBlob = new Blob([protocolDoc], { type: 'text/html' });
      const protocolFile = new File([protocolBlob], 'protocol.html', { type: 'text/html' });

      // Generate request document
      const requestDoc = generateRequestDocument(request);
      const requestBlob = new Blob([requestDoc], { type: 'text/html' });
      const requestFile = new File([requestBlob], 'request.html', { type: 'text/html' });

      try {
        // Upload all documents
        const protocolUrl = await uploadDocument(protocolFile, archived.id, 'protocol');
        const requestUrl = await uploadDocument(requestFile, archived.id, 'request');

        // Create zip file containing all documents
        const zipBlob = archived.zipBlob;
        const zipFile = new File([zipBlob], 'archive.zip', { type: 'application/zip' });
        const zipUrl = await uploadDocument(zipFile, archived.id, 'archive');

        // Insert archived protocol
        const { error: archiveError } = await supabase
          .from('archived_protocols')
          .insert({
            protocol_id: archived.id,
            zip_url: zipUrl
          });

        if (archiveError) {
          console.error('Error inserting archived protocol:', archiveError);
        }
      } catch (error) {
        console.error('Error uploading archived protocol documents:', error);
      }
    }

    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}</content>