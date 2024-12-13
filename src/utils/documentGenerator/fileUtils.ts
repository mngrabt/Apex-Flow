import { supabase } from '../../lib/supabase';

/**
 * Fetches a file from Supabase storage and returns it as a Blob
 */
export async function fetchProposalFile(url: string): Promise<Blob | null> {
  try {
    // Extract the path from the full URL if it's a public URL
    const path = url.includes('documents/') 
      ? url.split('documents/')[1]
      : url;

    // Download from storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path);

    if (error) throw error;

    return new Blob([data], { type: data.type });
  } catch (error) {
    console.error('Error fetching proposal file:', error);
    return null;
  }
}
