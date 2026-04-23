'use client';

import { useState, useMemo } from 'react';

interface PDFThumbnailProps {
  url: string;
  alt: string;
  className?: string;
}

export default function PDFThumbnail({ url, alt, className = '' }: PDFThumbnailProps) {
  // Memoize filename extraction
  const filename = useMemo(() => url.split('/').pop() || 'PDF Document', [url]);

  return (
    <div className={`bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-red-600 p-4 ${className}`}>
      <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-bold">PDF</span>
      <span className="text-xs text-center mt-1 opacity-75 max-w-full truncate" title={filename}>
        {filename}
      </span>
    </div>
  );
}
