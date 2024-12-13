import { supabase } from './supabase';

export async function uploadSignature(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(filePath);

    // Update user's signature_url
    const { error: updateError } = await supabase
      .from('users')
      .update({ signature_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading signature:', error);
    throw error;
  }
}

export async function uploadDocument(file: File, protocolId: string, type: 'protocol' | 'request' | 'commercial') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${protocolId}/${type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function getSignatureUrl(userId: string) {
  try {
    const { data, error } = await supabase.storage
      .from('signatures')
      .list('', {
        search: userId
      });

    if (error) throw error;

    if (data && data.length > 0) {
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(data[0].name);
      
      return publicUrl;
    }

    return null;
  } catch (error) {
    console.error('Error getting signature URL:', error);
    throw error;
  }
}

export async function getDocumentUrl(protocolId: string, type: 'protocol' | 'request' | 'commercial') {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .list(protocolId);

    if (error) throw error;

    const file = data.find(f => f.name.startsWith(type));
    if (file) {
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`${protocolId}/${file.name}`);
      
      return publicUrl;
    }

    return null;
  } catch (error) {
    console.error('Error getting document URL:', error);
    throw error;
  }
}