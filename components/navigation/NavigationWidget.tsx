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

interface NavigationWidgetProps {
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

export function NavigationWidget({ config }: NavigationWidgetProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);



  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (config.menuId) {
      fetchMenuItems();
    } else {
      setMenuItems([]);
    }
  }, [config.menuId]);

  const fetchMenuItems = async () => {
    try {
      // Use the correct menu items API endpoint
      const response = await fetch(`/api/menu/${config.menuId}/items`);
      const menuItems = await response.json();
      
      console.log('Menu items received:', menuItems); // Debug log
      
      if (Array.isArray(menuItems) && menuItems.length > 0) {
        // Convert database menu items to our format
        const formattedItems = menuItems.map(item => {
          let url = '#';
          
          // Handle different menu item types
          if (item.type === 'external' && item.url) {
            url = item.url;
          } else if (item.type === 'page' && item.page_id) {
            url = `/page/${item.page_id}`; // Adjust based on your page routing
          } else if (item.type === 'epaper_category' && item.category_id) {
            url = `/category/${item.category_id}`; // Adjust based on your category routing
          }
          
          return {
            id: item.id.toString(),
            title: item.title,
            url: url,
            children: [] // For now, no nested items
          };
        });
        console.log('Formatted menu items:', formattedItems); // Debug log
        setMenuItems(formattedItems);
      } else {
        console.log('No menu items found');
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setMenuItems([]);
    }
  };

  const toggleDropdown = (menuId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(menuId)) {
      newOpenDropdowns.delete(menuId);
    } else {
      newOpenDropdowns.add(menuId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const renderMenuItem = (item: MenuItem, isMobile: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;

    if (isMobile) {
      // Mobile accordion style
      return (
        <div key={item.id} className="nav-item">
          <div className="d-flex align-items-center">
            <Link
              href={item.url}
              className="nav-link flex-grow-1"
              style={{ color: config.textColor }}
              onClick={() => !hasChildren && setIsMenuOpen(false)}
            >
              {item.title}
            </Link>
            {hasChildren && (
              <button
                className="btn btn-sm"
                onClick={() => toggleDropdown(item.id)}
                style={{ color: config.textColor }}
              >
                {openDropdowns.has(item.id) ? '▼' : '▶'}
              </button>
            )}
          </div>
          {hasChildren && openDropdowns.has(item.id) && (
            <div className="ms-3 mt-2">
              {item.children.map(child => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    } else {
      // Desktop dropdown style
      if (hasChildren) {
        return (
          <div key={item.id} className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ color: config.textColor }}
            >
              {item.title}
            </a>
            <ul className="dropdown-menu">
              {item.children.map(child => (
                <li key={child.id}>
                  <Link className="dropdown-item" href={child.url}>
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        return (
          <div key={item.id} className="nav-item">
            <Link
              className="nav-link"
              href={item.url}
              style={{ color: config.textColor }}
            >
              {item.title}
            </Link>
          </div>
        );
      }
    }
  };

  const shouldShowLogo = () => {
    if (!config.logoUrl || !isMounted) return false;
    
    switch (config.logoStatus) {
      case 'hide-desktop':
        return window.innerWidth < 992; // Show only on mobile
      case 'hide-mobile':
        return window.innerWidth >= 992; // Show only on desktop
      case 'display-both':
      default:
        return true; // Show on both
    }
  };

  return (
    <nav 
      className={`navbar ${config.cssClasses || 'navbar-expand-lg'}`}
      style={{
        backgroundColor: config.backgroundColor || '#000000',
        ...parseInlineStyle(config.style)
      }}
    >
      <div className="container-fluid">
        {/* Logo */}
        {config.logoUrl && shouldShowLogo() && (
          <Link className="navbar-brand" href="/">
            <Image
              src={config.logoUrl}
              alt="Logo"
              width={150}
              height={50}
              className="d-inline-block align-text-top"
            />
          </Link>
        )}

        {/* Mobile menu toggle - Only show on mobile */}
        <button
          className="navbar-toggler d-lg-none"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          style={{ borderColor: config.textColor }}
        >
          <span 
            className="navbar-toggler-icon"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='${encodeURIComponent(config.textColor || '#fff')}' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")` 
            }}
          />
        </button>

        {/* Menu items - Always visible */}
        <div className="d-flex align-items-center justify-content-center flex-grow-1">
          {/* Desktop menu - Centered */}
          <div className="d-none d-lg-flex justify-content-center">
            {/* Menu Items Only - No Home Icon */}
            {menuItems.map(item => (
              <Link
                key={item.id}
                href={item.url}
                style={{ 
                  color: config.textColor || '#ffffff',
                  marginRight: '20px',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  display: 'block'
                }}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="d-lg-none position-absolute top-100 start-0 w-100 bg-dark">
              {menuItems.map(item => (
                <Link
                  key={item.id}
                  href={item.url}
                  style={{ 
                    color: config.textColor || '#ffffff',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    display: 'block',
                    borderBottom: '1px solid #333'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
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