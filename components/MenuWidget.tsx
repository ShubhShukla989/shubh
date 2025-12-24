'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface MenuItem {
  id: number;
  title: string;
  type: 'external' | 'page' | 'epaper_category' | 'epaper_archive';
  url?: string;
  page_id?: number;
  category_id?: number;
  parent_id?: number | null;
  children?: MenuItem[];
}

interface MenuWidgetProps {
  config: {
    menuId?: string;
    title?: string;
    displayStyle?: 'horizontal' | 'vertical' | 'dropdown';
    showTitle?: boolean;
    cssClasses?: string;
    style?: string;
  };
}

export function MenuWidget({ config }: MenuWidgetProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (config.menuId) {
      fetchMenuItems();
    } else {
      setLoading(false);
    }
  }, [config.menuId]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/menu/${config.menuId}/items`);
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        setMenuItems(buildMenuTree(items));
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildMenuTree = (items: MenuItem[]): MenuItem[] => {
    const itemMap = new Map<number, MenuItem>();
    const rootItems: MenuItem[] = [];

    // First pass: create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree structure
    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      } else {
        rootItems.push(menuItem);
      }
    });

    return rootItems;
  };

  const getItemUrl = (item: MenuItem): string => {
    switch (item.type) {
      case 'external':
        return item.url || '#';
      case 'page':
        return `/page/${item.page_id}`;
      case 'epaper_category':
        return `/epaper/category/${item.category_id}`;
      case 'epaper_archive':
        return '/epaper';
      default:
        return '#';
    }
  };

  const toggleDropdown = (itemId: number) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(itemId)) {
      newOpenDropdowns.delete(itemId);
    } else {
      newOpenDropdowns.add(itemId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.id);
    const itemUrl = getItemUrl(item);

    if (config.displayStyle === 'vertical') {
      return (
        <li key={item.id} className="mb-1">
          <div className="flex items-center justify-between">
            <Link
              href={itemUrl}
              className="flex-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors block fw-bold"
              target={item.type === 'external' ? '_blank' : '_self'}
              style={{ paddingLeft: `${12 + level * 16}px` }}
              dangerouslySetInnerHTML={{ __html: item.title }}
            >
            </Link>
            {hasChildren && (
              <button
                onClick={() => toggleDropdown(item.id)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
              </button>
            )}
          </div>
          {hasChildren && isOpen && (
            <ul className="mt-1 ml-4 border-l border-gray-200 pl-2">
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </ul>
          )}
        </li>
      );
    }

    // Horizontal style (default)
    return (
      <li key={item.id} className="relative group">
        <div className="flex items-center">
          <Link
            href={itemUrl}
            className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-1 fw-semibold"
            target={item.type === 'external' ? '_blank' : '_self'}
            dangerouslySetInnerHTML={{ __html: item.title + (hasChildren ? ' <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>' : '') }}
          >
          </Link>
        </div>
        {hasChildren && (
          <ul className="absolute top-full left-0 bg-white shadow-lg border rounded-md py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {item.children!.map(child => (
              <li key={child.id}>
                <Link
                  href={getItemUrl(child)}
                  className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors fw-bold"
                  target={child.type === 'external' ? '_blank' : '_self'}
                  dangerouslySetInnerHTML={{ __html: child.title }}
                >
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const renderDropdownMenu = () => {
    const flattenItems = (items: MenuItem[], level: number = 0): JSX.Element[] => {
      const elements: JSX.Element[] = [];
      items.forEach(item => {
        elements.push(renderMenuItem(item, level));
        if (item.children && item.children.length > 0) {
          elements.push(...flattenItems(item.children, level + 1));
        }
      });
      return elements;
    };

    return (
      <select
        onChange={(e) => {
          if (e.target.value && e.target.value !== '#') {
            window.location.href = e.target.value;
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        defaultValue=""
      >
        <option value="">-- Select Page --</option>
        {flattenItems(menuItems)}
      </select>
    );
  };

  if (loading) {
    return (
      <div className={`menu-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-28"></div>
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!config.menuId || menuItems.length === 0) {
    return (
      <div className={`menu-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        <div className="text-gray-500 text-sm italic">
          {!config.menuId ? 'No menu selected' : 'No menu items found'}
        </div>
      </div>
    );
  }

  return (
    <div className={`menu-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
      {config.showTitle && config.title && (
        <h3 className="text-lg font-semibold mb-3 text-gray-800 fw-bolder">{config.title}</h3>
      )}
      
      {config.displayStyle === 'dropdown' ? (
        renderDropdownMenu()
      ) : (
        <nav>
          <ul className={`${
            config.displayStyle === 'vertical' 
              ? 'space-y-1' 
              : 'flex flex-wrap gap-2'
          }`}>
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </nav>
      )}
    </div>
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