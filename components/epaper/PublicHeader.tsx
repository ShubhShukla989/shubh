'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function PublicHeader() {
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
      
      {/* Top Bar with Background Image and Logo */}
      <div 
        className="relative py-3 md:py-8 bg-cover bg-center"
        style={{ 
          backgroundImage: headerBgUrl ? `url(${headerBgUrl})` : 'none',
          backgroundColor: headerBgUrl ? 'transparent' : '#f5f5f5'
        }}
      >
        <div className="px-2 flex items-center justify-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="DBID दो बजे दोपहर" 
              className="h-16 md:h-28 lg:h-32 w-auto"
            />
          ) : (
            <div className="text-lg md:text-2xl font-bold text-red-600">
              DBID दो बजे दोपहर
            </div>
          )}
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
              {/* Home Icon */}
              <Link
                href="/epaper"
                className="hover:text-red-400 transition-colors flex items-center"
                title="Home"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
              
              {/* Menu Items */}
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

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            {/* Home Icon - Mobile */}
            <Link
              href="/epaper"
              className="flex items-center gap-2 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
              onClick={() => setShowMenu(false)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </Link>
            
            {/* Menu Items - Mobile */}
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
