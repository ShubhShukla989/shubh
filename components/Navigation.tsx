'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Page {
  id: number;
  alias: string;
  title: string;
}

interface MenuItem {
  id: number;
  title: string;
  type: 'external' | 'page' | 'epaper_category' | 'epaper_archive';
  url?: string;
  page_id?: number;
  page?: Page;
  category_id?: number;
  position: number;
  parent_id?: number | null;
}

interface NavigationProps {
  menuAlias?: string;
  className?: string;
}

export default function Navigation({ menuAlias = 'main-menu', className = '' }: NavigationProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, [menuAlias]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu/alias/${menuAlias}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
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

  const isExternalLink = (item: MenuItem): boolean => {
    return item.type === 'external';
  };

  if (loading) {
    return (
      <nav className={className}>
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={className}>
      <ul className="flex space-x-6">
        {menuItems.map((item) => (
          <li key={item.id}>
            {isExternalLink(item) ? (
              <a
                href={getMenuItemUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.title}
              </a>
            ) : (
              <Link
                href={getMenuItemUrl(item)}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
