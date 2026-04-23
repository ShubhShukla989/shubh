'use client';

import { useState, useCallback, useMemo } from 'react';

interface SimplePDFViewerProps {
  pdfUrl: string;
  pageNumber?: number;
  className?: string;
}

export default function SimplePDFViewer({ 
  pdfUrl, 
  pageNumber = 1,
  className = "w-full h-[550px]"
}: SimplePDFViewerProps) {
  const [showFallback, setShowFallback] = useState(false);

  // Memoize PDF URL with page number
  const pdfUrlWithPage = useMemo(() => `${pdfUrl}#page=${pageNumber}`, [pdfUrl, pageNumber]);

  const handleRetry = useCallback(() => setShowFallback(false), []);

  if (showFallback) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 border border-gray-200 rounded`}>
        <div className="text-center p-6">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview</h3>
          <p className="text-gray-600 mb-4">Page {pageNumber}</p>
          <div className="space-y-2">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
            >
              📄 Open PDF in New Tab
            </a>
            <br />
            <button
              onClick={handleRetry}
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <object
        data={pdfUrlWithPage}
        type="application/pdf"
        className="w-full h-full border border-gray-200 rounded"
        onError={() => setShowFallback(true)}
        aria-label={`PDF viewer showing page ${pageNumber}`}
      >
        <embed
          src={pdfUrlWithPage}
          type="application/pdf"
          className="w-full h-full border border-gray-200 rounded"
          onError={() => setShowFallback(true)}
          aria-label={`PDF viewer showing page ${pageNumber}`}
        />
      </object>
    </div>
  );
}
