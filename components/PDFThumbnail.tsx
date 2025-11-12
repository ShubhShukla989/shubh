'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFThumbnailProps {
  url: string;
  alt: string;
  className?: string;
}

export default function PDFThumbnail({ url, alt, className = '' }: PDFThumbnailProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setError('Failed to load PDF');
  }

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-xs text-gray-500 ${className}`}>
        Error
      </div>
    );
  }

  return (
    <div className={className}>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="bg-gray-100 flex items-center justify-center text-xs text-gray-500 w-full h-full">
            Loading...
          </div>
        }
      >
        <Page pageNumber={1} width={64} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    </div>
  );
}
