import { create } from 'zustand';
import { ArchivedProtocol } from '../types';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';
import { generateProtocolTemplate } from '../utils/templates/protocolTemplate';
import { generateRequestTemplate } from '../utils/templates/requestTemplate';
import { generateCashRequestTemplate } from '../utils/templates/cashRequestTemplate';

// Signature URLs for cash requests
const SIGNATURE_URLS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/abdurauf.png', 
  '00000000-0000-0000-0000-000000000003': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/fozil.png',    
  '00000000-0000-0000-0000-000000000004': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/aziz.png',    
  '00000000-0000-0000-0000-000000000005': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/umar.png'  
};

// Individual position controls for each signature
interface SignaturePosition {
  x: number;
  y: number;
}

const SIGNATURE_POSITIONS: Record<string, SignaturePosition> = {
  '00000000-0000-0000-0000-000000000001': { x: 0, y: -40 },  
  '00000000-0000-0000-0000-000000000003': { x: 0, y: -40 },  
  '00000000-0000-0000-0000-000000000004': { x: 0, y: -40 },   
  '00000000-0000-0000-0000-000000000005': { x: 0, y: -40 }   
};

interface ArchiveState {
  archivedProtocols: ArchivedProtocol[];
  fetchArchivedProtocols: () => Promise<void>;
  downloadArchive: (protocol: ArchivedProtocol, fileName: string) => Promise<void>;
  updateProtocolNumber: (protocolId: string, number: string) => Promise<void>;
}

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  archivedProtocols: [],

  fetchArchivedProtocols: async () => {
    try {
      const { data: archived, error } = await supabase
        .from('protocols')
        .select(`
          id,
          type,
          status,
          finance_status,
          department,
          archived_protocol:archived_protocols(
            created_at,
            zip_url,
            number
          ),
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
              created_at
            ),
            request:requests!tenders_request_id_fkey(
              id,
              number,
              date,
              department,
              categories,
              document_url,
              status,
              created_at,
              created_by,
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

      const archivedProtocols = (archived || []).map(protocol => {
        // Get the request's creation date based on protocol type
        const requestCreatedAt = protocol.type === 'cash' 
          ? protocol.request?.created_at 
          : protocol.tender?.request?.created_at;

        return {
          id: protocol.id,
          tenderId: protocol.tender?.id,
          type: protocol.type || 'tender',
          status: protocol.status,
          financeStatus: protocol.finance_status,
          createdAt: requestCreatedAt || protocol.archived_protocol?.created_at,
          zipUrl: protocol.archived_protocol?.zip_url,
          number: protocol.archived_protocol?.number,
          department: protocol.department,
          items: protocol.type === 'cash' && protocol.request ? 
            protocol.request.items.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              totalSum: item.total_sum
            })) : undefined,
          signatures: protocol.signatures.map(sig => ({
            userId: sig.user_id,
            date: sig.date
          })),
          tender: protocol.tender ? {
            id: protocol.tender.id,
            requestId: protocol.tender.request_id,
            status: protocol.tender.status,
            winnerId: protocol.tender.winner_id || '',
            winnerReason: protocol.tender.winner_reason,
            createdAt: protocol.tender.request?.created_at || protocol.tender.created_at,
            suppliers: protocol.tender.suppliers.map(supplier => ({
              id: supplier.id,
              companyName: supplier.company_name,
              contactPerson: supplier.contact_person,
              contactNumber: supplier.contact_number,
              deliveryTime: supplier.delivery_time,
              pricePerUnit: supplier.price_per_unit,
              price: supplier.price,
              includeTax: supplier.include_tax,
              proposalUrl: supplier.proposal_url,
              createdAt: supplier.created_at
            })),
            request: protocol.tender.request ? {
              id: protocol.tender.request.id,
              number: protocol.tender.request.number,
              date: protocol.tender.request.date,
              department: protocol.tender.request.department,
              categories: protocol.tender.request.categories || [],
              documentUrl: protocol.tender.request.document_url,
              status: protocol.tender.request.status,
              createdAt: protocol.tender.request.created_at,
              createdBy: protocol.tender.request.created_by,
              items: protocol.tender.request.items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                objectType: item.object_type,
                unitType: item.unit_type,
                quantity: item.quantity,
                deadline: item.deadline
              }))
            } : undefined
          } : undefined,
          request: protocol.type === 'cash' && protocol.request ? {
            id: protocol.request.id,
            type: 'cash',
            number: protocol.request.number,
            date: protocol.request.date,
            department: protocol.request.department,
            status: protocol.request.status,
            createdAt: protocol.request.created_at,
            createdBy: protocol.request.created_by,
            categories: protocol.request.categories || [],
            items: protocol.request.items.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              totalSum: item.total_sum || 0
            }))
          } : undefined
        };
      });

      set({ archivedProtocols });
    } catch (error) {
      console.error('Error in fetchArchivedProtocols:', error);
      throw error;
    }
  },

  updateProtocolNumber: async (protocolId: string, number: string) => {
    try {
      const { error } = await supabase
        .from('archived_protocols')
        .update({ number })
        .eq('protocol_id', protocolId);

      if (error) throw error;
      await get().fetchArchivedProtocols();
    } catch (error) {
      console.error('Error updating protocol number:', error);
      throw error;
    }
  },

  downloadArchive: async (protocol: ArchivedProtocol, fileName: string) => {
    try {
      if (protocol.type === 'cash') {
        // Generate HTML from template
        const html = await generateCashRequestTemplate(protocol);
        if (!html) {
          throw new Error('Failed to generate cash request template');
        }

        // Create blob and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${protocol.request?.items[0]?.name || 'Наличные'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For tender protocols, generate a zip with all documents
        const zip = new JSZip();

        if (!protocol.tender?.request) {
          throw new Error('Protocol data is incomplete');
        }

        // Generate protocol document
        const protocolDoc = generateProtocolTemplate(protocol, protocol.tender, protocol.tender.request);
        if (!protocolDoc) {
          throw new Error('Failed to generate protocol document');
        }
        zip.file('protocol.html', new Blob([protocolDoc], { type: 'text/html;charset=utf-8' }));

        // Generate request document
        const requestDoc = generateRequestTemplate(protocol.tender.request);
        if (!requestDoc) {
          throw new Error('Failed to generate request document');
        }
        zip.file('request.html', new Blob([requestDoc], { type: 'text/html;charset=utf-8' }));

        // Add winner's commercial offer if available
        const winner = protocol.tender.suppliers.find(s => s.id === protocol.tender.winnerId);
        if (winner?.proposalUrl) {
          try {
            const proposalResponse = await fetch(winner.proposalUrl);
            if (!proposalResponse.ok) {
              throw new Error('Failed to fetch winner proposal');
            }
            const proposalBlob = await proposalResponse.blob();
            const fileName = winner.proposalUrl.split('/').pop() || 'proposal.pdf';
            zip.file(fileName, proposalBlob);
          } catch (error) {
            console.error(`Failed to fetch proposal for supplier ${winner.id}:`, error);
          }
        }

        // Generate and download zip
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${protocol.tender?.request?.items[0]?.name || 'Протокол'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading archive:', error);
      throw error;
    }
  }
}));
