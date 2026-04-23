'use client';

import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface ClientPDFExtractorProps {
  editionId: number;
  pdfFile: File;
  onComplete: (pages: any[]) => void;
  onError: (error: string) => void;
}

export function ClientPDFExtractor({ editionId, pdfFile, onComplete, onError }: ClientPDFExtractorProps) {
  const [progress, setProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractPages = useCallback(async () => {
    try {
      setIsExtracting(true);
      setProgress(0);

      // Read PDF file
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;

      const extractedPages = [];

      // Process pages in batches to avoid memory issues
      const batchSize = 3;
      for (let i = 0; i < pageCount; i += batchSize) {
        const batch = [];
        const end = Math.min(i + batchSize, pageCount);
        
        for (let pageNum = i + 1; pageNum <= end; pageNum++) {
          batch.push(processPage(pdf, pageNum, pageCount));
        }
        
        const results = await Promise.all(batch);
        extractedPages.push(...results);
      }

      setProgress(100);
      onComplete(extractedPages);
    } catch (error: any) {
      onError(error.message || 'Failed to extract PDF pages');
    } finally {
      setIsExtracting(false);
    }
  }, [editionId, pdfFile, onComplete, onError]);

  const processPage = async (pdf: any, pageNum: number, totalPages: number) => {
    setProgress((pageNum / totalPages) * 100);

    // Get page
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false })!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert to blob with optimized quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    });

    // Upload to server
    const formData = new FormData();
    formData.append('file', blob, `page-${pageNum}.jpg`);
    formData.append('pageNumber', pageNum.toString());

    const response = await fetch(`/api/editions/${editionId}/upload-page`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload page ${pageNum}`);
    }

    const result = await response.json();
    
    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
    
    return result.data;
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Client-Side PDF Extraction</h3>
      
      {!isExtracting ? (
        <button
          onClick={extractPages}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Extract Pages (Client-Side)
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Extracting pages...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{Math.round(progress)}% complete</div>
        </div>
      )}
    </div>
  );
}