'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const NAV_HEIGHT = 56;

export function NavigationWidget({ config }: NavigationWidgetProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const bg = config.backgroundColor || '#000000';
  const textColor = config.textColor || '#ffffff';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener('resize', check);
    setIsMounted(true);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isMounted]);

  useEffect(() => {
    if (config.menuId) fetchMenuItems();
    else setMenuItems([]);
  }, [config.menuId]);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`/api/menu/${config.menuId}/items`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return setMenuItems([]);
      setMenuItems(data.map((item: any) => {
        let url = '#';
        if (item.type === 'external' && item.url) url = item.url;
        else if (item.type === 'page' && item.pages) url = `/epaper/page/${item.pages.alias}`;
        else if (item.type === 'epaper_category' && item.category_id) url = `/category/${item.category_id}`;
        return { id: item.id.toString(), title: item.title, url, children: [] };
      }));
    } catch {
      setMenuItems([]);
    }
  };

  const stripHtml = (html: string) =>
    html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');

  const navStyle: React.CSSProperties = {
    backgroundColor: bg,
    width: '100%',
    height: `${NAV_HEIGHT}px`,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    padding: '0 12px',
    ...parseInlineStyle(config.style),
  };

  // Always render the full nav — use CSS to show/hide parts
  // Never return null or a different element — this prevents layout shift
  return (
    <>
      <nav style={navStyle}>

        {/* LEFT: Hamburger (mobile) */}
        {isMounted && isMobile && (
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'none',
              border: `1.5px solid ${textColor}`,
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
              height: '34px',
              width: '40px',
              padding: '6px 8px',
              boxSizing: 'border-box',
              flexShrink: 0,
              zIndex: 2,
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block',
                height: '2px',
                width: '100%',
                background: textColor,
                borderRadius: '2px',
              }} />
            ))}
          </button>
        )}

        {/* LEFT: Logo */}
        {isMounted && config.logoUrl && (
          (() => {
            let show = true;
            if (config.logoStatus === 'hide-desktop') show = isMobile;
            if (config.logoStatus === 'hide-mobile') show = !isMobile;
            return show ? (
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: isMobile ? '10px' : '0',
                  textDecoration: 'none',
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                <Image
                  src={config.logoUrl}
                  alt="Logo"
                  width={120}
                  height={38}
                  style={{ objectFit: 'contain', display: 'block' }}
                />
              </Link>
            ) : null;
          })()
        )}

        {/* CENTER: Desktop menu — absolutely centered over full nav width */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: isMounted && isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}>
            {menuItems.map(item => (
              <Link
                key={item.id}
                href={item.url}
                style={{
                  color: textColor,
                  textDecoration: 'none',
                  padding: '0 14px',
                  fontWeight: 600,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  height: `${NAV_HEIGHT}px`,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {stripHtml(item.title)}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile sidebar portal */}
      {isMounted && isMobile && isMenuOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
            }}
          />

          {/* Drawer */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            background: '#fff',
            zIndex: 9999,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Drawer header */}
            <div style={{
              backgroundColor: bg,
              height: `${NAV_HEIGHT}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}>
              {config.logoUrl && (
                <Image
                  src={config.logoUrl}
                  alt="Logo"
                  width={100}
                  height={32}
                  style={{ objectFit: 'contain' }}
                />
              )}
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer items */}
            <div style={{ flex: 1 }}>
              {menuItems.map(item => (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#222',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    borderBottom: '1px solid #eee',
                    boxSizing: 'border-box',
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: item.title }} />
                </Link>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function parseInlineStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  try {
    const styles: any = {};
    styleString.split(';').forEach(rule => {
      const [prop, val] = rule.split(':').map(s => s.trim());
      if (prop && val) {
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        styles[camel] = val;
      }
    });
    return styles;
  } catch {
    return {};
  }
}
