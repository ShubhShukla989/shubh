'use client';

import Link from 'next/link';
import { Home, ZoomIn, ZoomOut, Scissors, Menu, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

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
      return `/page/${pageData.alias}`;
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Orange line at top */}
      <div className="h-1 bg-orange-500"></div>
      
      {/* Top Bar with Background Image and Logo */}
      <div 
        className="relative py-8 bg-cover bg-center"
        style={{ 
          backgroundImage: headerBgUrl ? `url(${headerBgUrl})` : 'none',
          backgroundColor: headerBgUrl ? 'transparent' : '#f5f5f5'
        }}
      >
        <div className="px-2 flex items-center justify-center">
          <Link href="/epaper" className="hover:opacity-90 transition-opacity">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="DBID दो बजे दोपहर" 
                className="h-28 md:h-32 w-auto"
              />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                DBID दो बजे दोपहर
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-gray-800 text-white">
        <div className="px-4">
          <div className="flex items-center justify-between h-12">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 hover:bg-gray-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {menuItems.map((item) => (
                isExternalLink(item) ? (
                  <a
                    key={item.id}
                    href={getMenuItemUrl(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-400 transition-colors whitespace-nowrap"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    href={getMenuItemUrl(item)}
                    className="hover:text-red-400 transition-colors whitespace-nowrap"
                  >
                    {item.title}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Viewer Controls */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-4">
          <div className="flex items-center justify-between py-3">
            {/* Left: Page Dropdown */}
            <div className="flex items-center gap-4">
              <Link
                href="/epaper"
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Back to Home"
              >
                <Home className="w-5 h-5 text-gray-700" />
              </Link>
              <select
                value={currentPage}
                onChange={(e) => onPageChange?.(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ))}
              </select>
            </div>

            {/* Center: Page Navigation */}
            <div className="flex items-center gap-1">
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

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onDownloadPDF}
                className="px-4 py-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
                title="Download PDF"
              >
                PDF
              </button>
              <button
                onClick={onClipStart}
                className="px-4 py-1.5 bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
                title="Clip Article"
              >
                Clip
              </button>
              <Link
                href="/epaper/archive"
                className="px-4 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                title="Archive"
              >
                Archive
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            {menuItems.map((item) => (
              isExternalLink(item) ? (
                <a
                  key={item.id}
                  href={getMenuItemUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-gray-700 hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  {item.title}
                </a>
              ) : (
                <Link
                  key={item.id}
                  href={getMenuItemUrl(item)}
                  className="block py-2 text-gray-700 hover:text-red-600 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  {item.title}
                </Link>
              )
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
