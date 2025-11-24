'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Newspaper,
  Sliders as SlidersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  permission?: string;
  superAdminOnly?: boolean;
}

interface MenuItemWithPermission extends MenuItem {
  permission?: string;
  superAdminOnly?: boolean;
}

const menuItems: MenuItemWithPermission[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
    permission: 'view_dashboard',
  },
  {
    label: 'Epaper',
    icon: <Newspaper className="w-5 h-5" />,
    permission: 'view_editions',
    children: [
      { label: 'All Editions', href: '/admin/editions', icon: null, permission: 'view_editions' },
      { label: 'Categories', href: '/admin/epaper/categories', icon: null, permission: 'view_categories' },
      { label: 'Featured Categories', href: '/admin/epaper/featured-categories', icon: null, permission: 'view_categories' },
      { label: 'Featured Editions', href: '/admin/epaper/featured-editions', icon: null, permission: 'view_editions' },
    ],
  },
  {
    label: 'Pages',
    href: '/admin/pages',
    icon: <FileText className="w-5 h-5" />,
    permission: 'view_pages',
  },
  {
    label: 'Slider',
    href: '/admin/sliders',
    icon: <SlidersIcon className="w-5 h-5" />,
    permission: 'view_sliders',
  },
  {
    label: 'Media',
    href: '/admin/media',
    icon: <Image className="w-5 h-5" />,
    permission: 'view_media',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    permission: 'view_users',
  },
  {
    label: 'System',
    icon: <Settings className="w-5 h-5" />,
    permission: 'view_settings',
    children: [
      { label: 'Page Designer', href: '/admin/designer', icon: null, permission: 'view_designer' },
      { label: 'Menus', href: '/admin/menus', icon: null, permission: 'view_menus' },
      { label: 'Settings', href: '/admin/system/settings', icon: null, permission: 'view_settings' },
      { label: 'Redirects', href: '/admin/system/redirects', icon: null, permission: 'view_settings' },
    ],
  },
  {
    label: 'Super Admin',
    icon: <Settings className="w-5 h-5" />,
    superAdminOnly: true,
    children: [
      { label: 'Audit Logs', href: '/admin/super-admin/logs', icon: null, superAdminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Epaper', 'System', 'Super Admin']);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const canAccessMenuItem = (item: MenuItemWithPermission): boolean => {
    // Super Admin can access everything
    if (isSuperAdmin()) return true;
    
    // Check if item is Super Admin only
    if (item.superAdminOnly) return false;
    
    // Check permission
    if (item.permission && !hasPermission(item.permission)) return false;
    
    return true;
  };

  const filterMenuItems = (items: MenuItemWithPermission[]): MenuItemWithPermission[] => {
    return items
      .filter(canAccessMenuItem)
      .map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter(canAccessMenuItem),
          };
        }
        return item;
      })
      .filter(item => !item.children || item.children.length > 0);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  const renderMenuItem = (item: MenuItemWithPermission, level = 0) => {
    const isExpanded = expandedItems.includes(item.label);
    const isActive = item.href === pathname;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
              level > 0 && 'pl-8'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="bg-gray-800/50">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href!}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
          isActive && 'bg-purple-600 text-white hover:bg-purple-700',
          level > 0 && 'pl-12 text-sm'
        )}
      >
        {item.icon}
        <span className={cn('font-medium', level === 0 && 'text-sm')}>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">ePaper CMS</h1>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        Version 1.0.0
      </div>
    </aside>
  );
}
