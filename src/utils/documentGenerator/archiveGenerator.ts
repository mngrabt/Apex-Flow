import { Protocol, Tender, Request } from '../../types';
import { generateProtocolTemplate } from '../templates/protocolTemplate';
import { generateRequestTemplate } from '../templates/requestTemplate';
import { fetchProposalFile } from './fileUtils';
import JSZip from 'jszip';

export async function generateArchiveZip(protocol: Protocol & { number?: string }): Promise<Blob> {
    if (!protocol.tender?.request) {
        throw new Error('Protocol data is incomplete');
    }

    const zip = new JSZip();

    // Generate HTML documents with proper encoding
    const protocolDoc = generateProtocolTemplate(protocol, protocol.tender, protocol.tender.request);
    const requestDoc = generateRequestTemplate(protocol.tender.request);

    if (!protocolDoc || !requestDoc) {
        throw new Error('Failed to generate documents');
    }

    // Add documents to zip with UTF-8 encoding
    zip.file('protocol.html', new Blob([protocolDoc], { type: 'text/html;charset=utf-8' }));
    zip.file('request.html', new Blob([requestDoc], { type: 'text/html;charset=utf-8' }));

    // Add winner's commercial offer if available
    const winner = protocol.tender.suppliers.find(s => s.id === protocol.tender.winnerId);
    if (winner?.proposalUrl) {
        try {
            const proposalFile = await fetchProposalFile(winner.proposalUrl);
            if (proposalFile) {
                const fileName = winner.proposalUrl.split('/').pop() || 'proposal.pdf';
                zip.file(fileName, proposalFile);
            }
        } catch (error) {
            console.error(`Failed to fetch proposal for supplier ${winner.id}:`, error);
        }
    }

    // Generate final zip file with compression
    return await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        mimeType: 'application/zip',
        platform: 'UNIX'
    });
}
