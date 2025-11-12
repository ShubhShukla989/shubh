import { supabase } from './supabase';

export async function uploadPDFToSupabase(
  file: File,
  editionId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    // Upload directly to Supabase Storage
    const fileName = `edition-${editionId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('editions')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('editions')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Update edition record via API
    const response = await fetch(`/api/editions/${editionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_url: pdfUrl }),
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to update edition' };
    }

    return { success: true, url: pdfUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
