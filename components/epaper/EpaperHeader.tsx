'use client';

import Link from 'next/link';
import { Home, ZoomIn, ZoomOut, Scissors, Menu, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import CalendarModal from './CalendarModal';
import { EpaperPdfDownloadWidget } from './EpaperPdfDownloadWidget';

interface EpaperHeaderProps {
  editionId: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClipStart: () => void;
  onShare?: () => void;
  onPageChange?: (page: number) => void;
  onDownloadPDF?: () => void;
  editionTitle?: string;
  editionDate?: string;
}

export default function EpaperHeader({
  editionId,
  currentPage,
  totalPages,
  zoom,
  onZoomIn,
  onZoomOut,
  onClipStart,
  onShare,
  onPageChange,
  onDownloadPDF,
  editionTitle,
  editionDate
}: EpaperHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [headerBgUrl, setHeaderBgUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchMediaUrls();
  }, []);

  const fetchMediaUrls = async () => {
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        const mediaFiles = data.data || [];
        
        // Find header-bg and logo by title or filename
        const headerBg = mediaFiles.find((file: any) => 
          file.title === 'header-bg' || file.name === 'header-bg' || 
          file.name?.includes('header-bg')
        );
        const logo = mediaFiles.find((file: any) => 
          file.title === 'logo' || file.name === 'logo' || 
          file.name?.includes('logo')
        );
        
        if (headerBg) setHeaderBgUrl(headerBg.url);
        if (logo) setLogoUrl(logo.url);
      }
    } catch (error) {
      console.error('Failed to fetch media URLs:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu/alias/main-menu?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const getMenuItemUrl = (item: any): string => {
    if (item.type === 'external' && item.url) {
      return item.url;
    } else if (item.type === 'page' && (item.page || item.pages)) {
      const pageData = item.page || item.pages;
      return `/epaper/page/${pageData.alias}`;
    } else if (item.type === 'epaper_category' && item.category_id) {
      return `/epaper/category/${item.category_id}`;
    } else if (item.type === 'epaper_archive') {
      return '/epaper/archive';
    }
    return '#';
  };

  const isExternalLink = (item: any): boolean => {
    return item.type === 'external';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      {/* Orange line at top */}
      <div className="h-1 bg-orange-500"></div>



      {/* Viewer Controls - Responsive */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-2 md:px-4">
          <div className="flex items-center justify-between py-2 md:py-3">
            {/* Left: Page Dropdown */}
            <div className="flex items-center gap-1 md:gap-4">
              <select
                value={currentPage}
                onChange={(e) => onPageChange?.(Number(e.target.value))}
                className="px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ))}
              </select>
            </div>

            {/* Center: Page Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => onPageChange?.(1)}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  currentPage === 1
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title="Page 1"
              >
                1
              </button>

              {/* Show pages 2-4 if we have them */}
              {totalPages >= 2 && (
                <button
                  onClick={() => onPageChange?.(2)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    currentPage === 2
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  title="Page 2"
                >
                  2
                </button>
              )}
              
              {totalPages >= 3 && (
                <button
                  onClick={() => onPageChange?.(3)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    currentPage === 3
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  title="Page 3"
                >
                  3
                </button>
              )}
              
              {totalPages >= 4 && (
                <button
                  onClick={() => onPageChange?.(4)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    currentPage === 4
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  title="Page 4"
                >
                  4
                </button>
              )}

              {/* Show dots if there are more pages */}
              {totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}

              {/* Last page (if more than 5 pages) */}
              {totalPages > 5 && (
                <button
                  onClick={() => onPageChange?.(totalPages)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    currentPage === totalPages
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  title={`Page ${totalPages}`}
                >
                  {totalPages}
                </button>
              )}

              {/* Next button */}
              <button
                onClick={() => onPageChange?.(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-1 px-2 h-8 flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                »
              </button>
            </div>

            {/* Right: Action Buttons - Responsive */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={onClipStart}
                className="px-2 md:px-4 py-1 md:py-1.5 bg-blue-500 text-white hover:bg-blue-600 transition-colors text-xs md:text-sm font-medium rounded"
                title="Clip Article"
              >
                Clip
              </button>
              
              {/* Archive button with mobile PDF widget */}
              <div className="flex items-center gap-1">
                {/* Mobile-only PDF Download Widget */}
                <div className="block md:hidden">
                  <EpaperPdfDownloadWidget 
                    config={{
                      buttonText: 'PDF',
                      target: 'new-window',
                      cssClasses: 'inline-block'
                    }}
                  />
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="px-2 md:px-4 py-1 md:py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-xs md:text-sm font-medium rounded"
                    title="Archive"
                  >
                    Archive
                  </button>
                  
                  {/* Calendar Modal */}
                  {showCalendar && (
                    <CalendarModal onClose={() => setShowCalendar(false)} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </header>
  );
}
