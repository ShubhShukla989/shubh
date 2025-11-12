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

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Epaper',
    icon: <Newspaper className="w-5 h-5" />,
    children: [
      { label: 'All Editions', href: '/admin/editions', icon: null },
      { label: 'Categories', href: '/admin/epaper/categories', icon: null },
      { label: 'Featured Categories', href: '/admin/epaper/featured-categories', icon: null },
      { label: 'Featured Editions', href: '/admin/epaper/featured-editions', icon: null },
    ],
  },
  {
    label: 'Pages',
    href: '/admin/pages',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Slider',
    href: '/admin/sliders',
    icon: <SlidersIcon className="w-5 h-5" />,
  },
  {
    label: 'Media',
    href: '/admin/media',
    icon: <Image className="w-5 h-5" />,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'System',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { label: 'Page Designer', href: '/admin/designer', icon: null },
      { label: 'Menus', href: '/admin/menus', icon: null },
      { label: 'Settings', href: '/admin/system/settings', icon: null },
      { label: 'Redirects', href: '/admin/system/redirects', icon: null },
    ],
  },
  {
    label: 'Super Admin',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { label: 'Audit Logs', href: '/admin/super-admin/logs', icon: null },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Epaper', 'System', 'Super Admin']);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
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
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        Version 1.0.0
      </div>
    </aside>
  );
}
