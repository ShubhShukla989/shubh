'use client';

import { useRef, useEffect } from 'react';
import PDFThumbnail from '@/components/PDFThumbnail';

interface Page {
  number: number;
  imageUrl: string;
}

interface PageThumbnailsProps {
  pages: Page[];
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export default function PageThumbnails({
  pages,
  currentPage,
  onPageSelect
}: PageThumbnailsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Scroll active thumbnail into view
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  return (
    <div className="w-36 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-3 space-y-3">
        {pages.map((page) => (
          <button
            key={page.number}
            ref={page.number === currentPage ? activeRef : null}
            onClick={() => onPageSelect(page.number)}
            className={`w-full aspect-[3/4] rounded overflow-hidden border-2 transition-all ${
              page.number === currentPage
                ? 'border-red-500 ring-2 ring-red-500/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            title={`Page ${page.number}`}
          >
            <div className="relative w-full h-full bg-gray-100">
              {page.imageUrl?.endsWith('.pdf') ? (
                <PDFThumbnail
                  url={page.imageUrl}
                  alt={`Page ${page.number}`}
                  className="w-full h-full"
                />
              ) : (
                <img
                  src={page.imageUrl}
                  alt={`Page ${page.number}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140'%3E%3Crect fill='%234b5563' width='100' height='140'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23fff' font-size='16'%3E${page.number}%3C/text%3E%3C/svg%3E`;
                  }}
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                {page.number}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
