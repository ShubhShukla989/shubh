'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  children: MenuItem[];
}

interface NavigationWidgetMobileProps {
  config: {
    logoUrl?: string;
    logoStatus?: string;
    backgroundColor?: string;
    textColor?: string;
    menuId?: string;
    cssClasses?: string;
    style?: string;
  };
}

export function NavigationWidgetMobile({ config }: NavigationWidgetMobileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (config.menuId) {
      fetchMenuItems();
    } else {
      setMenuItems([]);
    }
  }, [config.menuId]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu/${config.menuId}/items`);
      const menuItems = await response.json();
      
      if (Array.isArray(menuItems) && menuItems.length > 0) {
        const formattedItems = menuItems.map(item => {
          let url = '#';
          
          if (item.type === 'external' && item.url) {
            url = item.url;
          } else if (item.type === 'page' && item.page_id) {
            url = `/page/${item.page_id}`;
          } else if (item.type === 'epaper_category' && item.category_id) {
            url = `/category/${item.category_id}`;
          }
          
          return {
            id: item.id.toString(),
            title: item.title,
            url: url,
            children: []
          };
        });
        setMenuItems(formattedItems);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setMenuItems([]);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav 
      className={`navbar-mobile ${config.cssClasses || ''}`}
      style={{
        backgroundColor: config.backgroundColor || '#000000',
        ...parseInlineStyle(config.style)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        {config.logoUrl && (
          <Link className="navbar-brand" href="/" onClick={closeMenu}>
            <Image
              src={config.logoUrl}
              alt="Logo"
              width={150}
              height={40}
              className="h-auto w-auto max-h-[40px] max-w-[150px] object-contain"
              style={{ maxHeight: '40px', maxWidth: '150px' }}
            />
          </Link>
        )}

        {/* Hamburger Menu Button */}
        <button
          className="hamburger-btn p-2 hover:bg-white/10 rounded transition-colors"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          style={{ color: config.textColor || '#ffffff', minWidth: '44px', minHeight: '44px' }}
        >
          <div className="hamburger-icon" style={{ margin: 'auto' }}>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 z-[9998]"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
            onClick={closeMenu}
          ></div>
          
          {/* Menu Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-[280px] max-w-[85vw] shadow-2xl z-[9999] overflow-y-auto"
            style={{
              backgroundColor: config.backgroundColor || '#000000',
              position: 'fixed',
              height: '100vh'
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              {config.logoUrl && (
                <Image
                  src={config.logoUrl}
                  alt="Logo"
                  width={120}
                  height={32}
                  className="h-auto w-auto max-h-[32px] max-w-[120px] object-contain"
                  style={{ maxHeight: '32px', maxWidth: '120px' }}
                />
              )}
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                style={{ color: config.textColor || '#ffffff' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.length > 0 ? (
                menuItems.map(item => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="block px-6 py-4 text-base font-medium hover:bg-white/10 transition-colors"
                    style={{ 
                      color: config.textColor || '#ffffff',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={closeMenu}
                  >
                    {item.title}
                  </Link>
                ))
              ) : (
                <div className="px-6 py-4 text-sm" style={{ color: config.textColor || '#ffffff', opacity: 0.7 }}>
                  No menu items
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Hamburger Styles */}
      <style jsx>{`
        .hamburger-icon {
          width: 24px;
          height: 18px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .hamburger-line {
          width: 100%;
          height: 2px;
          background-color: currentColor;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        
        .hamburger-line.open:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }
        
        .hamburger-line.open:nth-child(2) {
          opacity: 0;
        }
        
        .hamburger-line.open:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }
      `}</style>
    </nav>
  );
}

function parseInlineStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  
  try {
    const styles: any = {};
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProperty] = value;
      }
    });
    return styles;
  } catch {
    return {};
  }
}