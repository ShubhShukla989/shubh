'use client';

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
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import PrefetchLink from './PrefetchLink';

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
    icon: <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><LayoutDashboard className="w-4 h-4 text-blue-600" /></div>,
    permission: 'view_dashboard',
  },
  {
    label: 'Epaper',
    icon: <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Newspaper className="w-4 h-4 text-green-600" /></div>,
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
    icon: <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-purple-600" /></div>,
    permission: 'view_pages',
  },
  {
    label: 'Slider',
    href: '/admin/sliders',
    icon: <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><SlidersIcon className="w-4 h-4 text-orange-600" /></div>,
    permission: 'view_sliders',
  },
  {
    label: 'Media',
    href: '/admin/media',
    icon: <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center"><Image className="w-4 h-4 text-pink-600" /></div>,
    permission: 'view_media',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-indigo-600" /></div>,
    permission: 'view_users',
  },
  {
    label: 'System',
    icon: <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Settings className="w-4 h-4 text-gray-600" /></div>,
    permission: 'view_settings',
    children: [
      { label: 'Page Designer', href: '/admin/designer', icon: null, permission: 'view_designer' },
      { label: 'Menus', href: '/admin/menus', icon: null, permission: 'view_menus' },
      { label: 'Settings', href: '/admin/system/settings', icon: null, permission: 'view_settings' },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin, loading } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? [] : [label]
    );
  };

  const canAccessMenuItem = (item: MenuItemWithPermission): boolean => {
    // If still loading, show all items to avoid flash of incomplete menu
    if (loading) {
      return true;
    }
    
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
              'w-full flex items-center justify-between px-4 py-2.5 text-gray-900 hover:bg-blue-50 hover:text-blue-500 transition-colors rounded-lg',
              level > 0 && 'pl-8'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="bg-blue-50/30">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <PrefetchLink
        key={item.label}
        href={item.href!}
        onClick={onClose} // Close sidebar on mobile when link is clicked
        prefetchDelay={150} // Elite: 150ms hover delay
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-500 transition-colors rounded-lg',
          isActive && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
          level > 0 && 'pl-12 text-sm'
        )}
      >
        <div className="flex-shrink-0">{item.icon}</div>
        <span className={cn('font-medium', level === 0 && 'text-sm')}>{item.label}</span>
      </PrefetchLink>
    );
  };

  return (
    <aside className="w-64 bg-white min-h-screen flex flex-col border-r border-gray-200 shadow-lg lg:shadow-sm">
      {/* Header with close button for mobile */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Epaper CMS</h1>
          <p className="text-xs text-gray-600 mt-1">Admin Panel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors border border-gray-200"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        Version 1.0.0
      </div>
    </aside>
  );
}
