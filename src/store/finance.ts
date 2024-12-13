import { create } from 'zustand';
import { Protocol } from '../types';
import { supabase } from '../lib/supabase';
import { useCalendarStore } from './calendar';
import JSZip from 'jszip';
import { generateProtocolTemplate } from '../utils/templates/protocolTemplate';
import { generateRequestTemplate } from '../utils/templates/requestTemplate';

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

interface FinanceState {
  protocols: Protocol[];
  fetchProtocols: () => Promise<void>;
  submitProtocol: (protocolId: string, urgency: 'high' | 'low') => Promise<void>;
  markAsPaid: (protocolId: string) => Promise<void>;
  getWaitingDays: (protocol: Protocol) => number;
  getTotalWaitingDays: (protocol: Protocol) => number;
  deleteExpiredProtocols: () => Promise<void>;
  updateProtocolNumber: (protocolId: string, number: string) => Promise<void>;
  downloadArchive: (protocol: Protocol, fileName: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  protocols: [],
  
  fetchProtocols: async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select(`
          id,
          type,
          status,
          finance_status,
          urgency,
          submitted_at,
          paid_at,
          created_at,
          department,
          archived:archived_protocols!inner(
            number
          ),
          signatures:protocol_signatures(
            user_id,
            date
          ),
          tender:tenders!protocols_tender_id_fkey (
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
            request:requests!tenders_request_id_fkey (
              id,
              number,
              date,
              department,
              categories,
              document_url,
              status,
              created_at,
              created_by,
              items:request_items (
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
          request:requests!protocols_request_id_fkey (
            id,
            number,
            date,
            department,
            status,
            created_at,
            created_by,
            items:request_items (
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

      // Transform the data to match our Protocol type
      const transformedData = (data || []).map(p => ({
        id: p.id,
        type: p.type,
        status: p.status,
        financeStatus: p.finance_status,
        urgency: p.urgency,
        submittedAt: p.submitted_at,
        paidAt: p.paid_at,
        createdAt: p.created_at,
        tenderId: p.tender?.id,
        number: p.archived?.number,
        department: p.department,
        signatures: p.signatures?.map((sig: any) => ({
          userId: sig.user_id,
          date: sig.date
        })) || [],
        request: p.type === 'cash' && p.request ? {
          id: p.request.id,
          type: 'cash',
          number: p.request.number,
          date: p.request.date,
          department: p.request.department,
          status: p.request.status,
          createdAt: p.request.created_at,
          createdBy: p.request.created_by,
          items: p.request.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            totalSum: item.total_sum || 0
          }))
        } : undefined,
        tender: p.type === 'tender' && p.tender ? {
          id: p.tender.id,
          requestId: p.tender.request_id,
          status: p.tender.status,
          winnerId: p.tender.winner_id || '',
          winnerReason: p.tender.winner_reason,
          createdAt: p.tender.created_at,
          suppliers: p.tender.suppliers?.map((s: any) => ({
            id: s.id,
            companyName: s.company_name,
            contactPerson: s.contact_person,
            contactNumber: s.contact_number,
            deliveryTime: s.delivery_time,
            pricePerUnit: s.price_per_unit,
            price: s.price,
            includeTax: s.include_tax,
            proposalUrl: s.proposal_url,
            createdAt: s.created_at
          })) || [],
          request: p.tender.request ? {
            id: p.tender.request.id,
            type: 'transfer',
            number: p.tender.request.number,
            date: p.tender.request.date,
            department: p.tender.request.department,
            categories: p.tender.request.categories || [],
            documentUrl: p.tender.request.document_url,
            status: p.tender.request.status,
            createdAt: p.tender.request.created_at,
            createdBy: p.tender.request.created_by,
            items: p.tender.request.items.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              objectType: item.object_type,
              unitType: item.unit_type,
              quantity: item.quantity,
              deadline: item.deadline
            }))
          } : undefined
        } : undefined
      }));

      set({ protocols: transformedData });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      set({ protocols: [] });
    }
  },

  submitProtocol: async (protocolId, urgency) => {
    try {
      const { error } = await supabase
        .from('protocols')
        .update({
          finance_status: 'waiting',
          urgency,
          submitted_at: new Date().toISOString()
        })
        .eq('id', protocolId);

      if (error) throw error;

      // Update local state immediately
      set(state => ({
        protocols: state.protocols.map(protocol =>
          protocol.id === protocolId
            ? {
                ...protocol,
                finance_status: 'waiting',
                financeStatus: 'waiting',
                urgency,
                submitted_at: new Date().toISOString(),
                submittedAt: new Date().toISOString()
              }
            : protocol
        )
      }));

      // Fetch fresh data from server
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error submitting protocol for payment:', error);
      throw error;
    }
  },

  markAsPaid: async (protocolId) => {
    try {
      // Update protocol status
      const { error } = await supabase
        .from('protocols')
        .update({
          finance_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', protocolId);

      if (error) throw error;

      // Update local state immediately
      set(state => ({
        protocols: state.protocols.map(protocol =>
          protocol.id === protocolId
            ? {
                ...protocol,
                finance_status: 'paid',
                financeStatus: 'paid',
                paid_at: new Date().toISOString(),
                paidAt: new Date().toISOString()
              }
            : protocol
        )
      }));

      // Fetch fresh data from server
      await get().fetchProtocols();

      // Trigger calendar store to fetch updated events
      const calendarStore = useCalendarStore.getState();
      await calendarStore.fetchEvents();

    } catch (error) {
      console.error('Error marking protocol as paid:', error);
      throw error;
    }
  },

  getWaitingDays: (protocol) => {
    if (!protocol.submittedAt) return 0;
    return Math.floor((Date.now() - new Date(protocol.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  },

  getTotalWaitingDays: (protocol) => {
    if (!protocol.submittedAt || !protocol.paidAt) return 0;
    return Math.floor((new Date(protocol.paidAt).getTime() - new Date(protocol.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  },

  deleteExpiredProtocols: async () => {
    try {
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

      const { error } = await supabase
        .from('protocols')
        .delete()
        .eq('finance_status', 'paid')
        .lt('paid_at', twentyOneDaysAgo.toISOString());

      if (error) throw error;
      
      // Fetch fresh data after deletion
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error deleting expired protocols:', error);
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

      // Update local state
      set(state => ({
        protocols: state.protocols.map(p =>
          p.id === protocolId
            ? { ...p, number }
            : p
        )
      }));

      // Fetch fresh data
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error updating protocol number:', error);
      throw error;
    }
  },

  downloadArchive: async (protocol: Protocol, fileName: string) => {
    try {
      if (protocol.type === 'cash') {
        // For cash requests, generate HTML from template
        const response = await fetch('/templates/cash_request.html');
        const template = await response.text();

        // Get the first item from the request
        const item = protocol.request?.items[0];
        if (!item) throw new Error('No items found in request');

        // Format date
        const date = new Date(protocol.request?.date || '').toLocaleDateString('ru-RU');

        // Function to generate signature image if user has signed
        const getSignatureHtml = (userId: string) => {
          if (protocol.signatures.some(sig => sig.userId === userId) && SIGNATURE_URLS[userId]) {
            const position = SIGNATURE_POSITIONS[userId];
            return `<div class="signature-image" style="position: absolute; left: calc(50% + ${position.x}px); top: ${position.y}px; z-index: 1; pointer-events: none; transform: translate(-50%, 0);">
              <img src="${SIGNATURE_URLS[userId]}" alt="Подпись" style="height: 50px; margin: 0; padding: 0; display: block;">
            </div>`;
          }
          return '';
        };

        // Add signature styles to the template
        let html = template.replace('</style>', `
          .signature-container {
            position: relative;
            margin-bottom: 1px;
            white-space: nowrap;
            line-height: 0;
          }
          .signature-image {
            position: absolute;
            z-index: 1;
            pointer-events: none;
            transform: translate(-50%, 0);
          }
          .signature-image img {
            margin: 0;
            padding: 0;
            display: block;
          }
        </style>`);

        // Replace placeholders in template
        html = html
          .replace('03.12.2024', date)
          .replace('Наклейки на огнетушители', item.name)
          .replace('8 шт.', `${item.quantity} шт.`)
          .replace('100 000 сум (сто тысяч сум)', `${item.totalSum.toLocaleString('ru-RU')} сум`)
          .replace('Приобретение и установка наклеек для маркировки огнетушителей', item.description || '');

        // Add signature images
        html = html
          .replace('<p>Продакшен Менеджер<span class="sign-line"></span>А. Гани</p>', 
            `<div class="signature-container">Продакшен Менеджер<span class="sign-line">${getSignatureHtml('00000000-0000-0000-0000-000000000001')}</span>А. Гани</div>`)
          .replace('<p>Член закупочной комиссии<span class="sign-line"></span>Ф.А. Бабаджанов</p>', 
            `<div class="signature-container">Член закупочной комиссии<span class="sign-line">${getSignatureHtml('00000000-0000-0000-0000-000000000003')}</span>Ф.А. Бабаджанов</div>`)
          .replace('<p>Генеральный директор<span class="sign-line"></span>А.Р. Раимжонов</p>', 
            `<div class="signature-container">Генеральный директор<span class="sign-line">${getSignatureHtml('00000000-0000-0000-0000-000000000004')}</span>А.Р. Раимжонов</div>`);

        // Create blob and download
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash_request_${protocol.request?.number || protocol.id}.html`;
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
        a.download = `protocol_${protocol.number || protocol.id}.zip`;
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