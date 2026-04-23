/**
 * Upload PDF file to local storage
 * Handles PDF upload for editions
 */
export async function uploadPDFToLocal(
  file: File,
  editionId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Use the edition-specific upload API endpoint that updates the database
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`/api/editions/${editionId}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Upload failed' };
    }

    return { success: true, url: result.data.pdf_url };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
