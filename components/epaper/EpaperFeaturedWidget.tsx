'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TreeNode {
  id: number;
  title: string;
  children: TreeNode[];
}

interface EpaperFeaturedWidgetProps {
  config: {
    title?: string;
    categoryTree?: TreeNode[];
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    perRowCount?: number;
    cropThumbnails?: string;
    categoryNamePosition?: string;
    datePosition?: string;
    backButtonText?: string;
    linkTo?: string;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperFeaturedWidget({ config }: EpaperFeaturedWidgetProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [latestEditions, setLatestEditions] = useState<{ [key: number]: any }>({});
  const [loading, setLoading] = useState(true);
  
  // State management for navigation
  const [currentView, setCurrentView] = useState<'groups' | 'cities'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<TreeNode | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const categoryTreeKey = JSON.stringify(config.categoryTree);

  useEffect(() => {
    fetchCategoriesData();
  }, [categoryTreeKey]);

  const fetchCategoriesData = async () => {
    if (!config.categoryTree || config.categoryTree.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const categoryIds = getAllCategoryIds(config.categoryTree);

      // Fetch category details and latest editions in parallel
      const [categoriesResult, editionsResult] = await Promise.all([
        fetch('/api/epaper/categories').then(r => r.json()),
        fetch(`/api/editions/latest-by-categories?ids=${categoryIds.join(',')}`).then(r => r.json()),
      ]);

      if (categoriesResult.success) {
        const allCategories = categoriesResult.data || [];
        setCategories(allCategories.filter((cat: any) => categoryIds.includes(cat.id)));
      }

      if (editionsResult.success) {
        // API returns { categoryId: edition } map
        setLatestEditions(editionsResult.data || {});
      }
    } catch (error) {
      // Failed to fetch
    } finally {
      setLoading(false);
    }
  };

  const getAllCategoryIds = (nodes: TreeNode[]): number[] => {
    let ids: number[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children && node.children.length > 0) {
        ids = [...ids, ...getAllCategoryIds(node.children)];
      }
    });
    return ids;
  };

  const getCategoryData = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getCategoryThumbnail = (categoryId: number): string | null => {
    const edition = latestEditions[categoryId];
    if (edition?.pages?.[0]?.thumb_url) {
      return edition.pages[0].thumb_url;
    }
    return null;
  };

  const getLinkUrl = (categoryId: number) => {
    const linkTo = config.linkTo || 'category-archive';
    
    if (linkTo === 'latest-edition') {
      const edition = latestEditions[categoryId];
      if (edition) {
        return `/epaper/view/${edition.id}`;
      }
    }
    
    // Default to category archive
    const category = getCategoryData(categoryId);
    return category ? `/epaper/category/${category.alias || categoryId}` : '#';
  };

  // Handle group selection (State 1 -> State 2)
  const handleGroupClick = (group: TreeNode) => {
    if (group.children && group.children.length > 0) {
      setSelectedGroup(group);
      setCurrentView('cities');
    } else {
      // If no children, go directly to category page
      window.location.href = getLinkUrl(group.id);
    }
  };

  // Handle back button (State 2 -> State 1)
  const handleBackClick = () => {
    setCurrentView('groups');
    setSelectedGroup(null);
  };

  // Get root level categories (groups)
  const getRootCategories = () => {
    return config.categoryTree || [];
  };

  // Get cities for selected group (Only Sub categories, exclude parent)
  const getCitiesForGroup = () => {
    if (!selectedGroup) return [];
    
    // Return only children, exclude the parent category
    return selectedGroup.children || [];
  };

  const renderCategoryCard = (node: TreeNode, level: number = 0, showChildren: boolean = false, index: number = 0, totalCount: number = 1, perRow: number = 3, isGroupView: boolean = false) => {
    const category = getCategoryData(node.id);
    const thumbnail = getCategoryThumbnail(node.id);
    const edition = latestEditions[node.id];
    
    // Mobile-first responsive dimensions
    const thumbnailWidth = isMobile ? 350 : (config.thumbnailWidth || 180);
    const thumbnailHeight = isMobile ? 500 : (config.thumbnailHeight || 240);
    const cropThumbnails = config.cropThumbnails !== 'no';
    const categoryNamePosition = config.categoryNamePosition || 'bottom';
    const datePosition = config.datePosition || 'none';

    if (!category) return null;

    const displayTitle = category.title;

    const handleClick = (e: React.MouseEvent) => {
      if (isGroupView && node.children && node.children.length > 0) {
        e.preventDefault();
        handleGroupClick(node);
      }
      // For cities view or categories without children, let the Link handle navigation
    };

    return (
      <div 
        key={node.id} 
        className="featured-category-item bg-white shadow-xl cursor-pointer relative"
        style={{ 
          marginLeft: level > 0 ? '20px' : '0',
          width: isMobile ? '100%' : `${thumbnailWidth}px`,
          height: `${thumbnailHeight}px`,
          borderRadius: '0px',
          overflow: 'hidden',
          maxWidth: isMobile ? '350px' : 'none',
          margin: '0',
        }}
        onClick={handleClick}
      >
        <Link href={isGroupView && node.children && node.children.length > 0 ? '#' : getLinkUrl(node.id)} className="block relative group h-full">
          {/* Thumbnail */}
          <div 
            className="relative overflow-hidden w-full h-full"
          >
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={category.title}
                width={thumbnailWidth}
                height={thumbnailHeight}
                className={cropThumbnails ? 'object-cover w-full h-full' : 'object-contain w-full h-full'}
              />
            ) : (
              <div 
                className="bg-gray-100 flex items-center justify-center text-gray-400 w-full h-full"
              >
                <span className="text-4xl">📰</span>
              </div>
            )}

            {/* Category Name Overlay */}
            {categoryNamePosition === 'overlay' && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{category.title}</h3>
              </div>
            )}

            {/* Date Overlay */}
            {datePosition === 'overlay' && edition && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {new Date(edition.date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Category Name Top */}
          {categoryNamePosition === 'top' && (
            <div className="absolute top-0 left-0 right-0 bg-white p-3">
              <h3 className="font-bold text-sm text-gray-800 text-center">{displayTitle}</h3>
              {datePosition === 'top' && edition && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {new Date(edition.date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Link>

        {/* Category Name Bottom */}
        {categoryNamePosition === 'bottom' && (
          <div className="absolute bottom-1 left-0 right-0 bg-white p-2" style={{ zIndex: 1 }}>
            <h3 className="font-bold text-sm text-gray-800 text-center">{displayTitle}</h3>
            {datePosition === 'bottom' && edition && (
              <p className="text-xs text-gray-500 text-center mt-1">
                {new Date(edition.date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Date Bottom (when category is none but date is bottom) */}
        {categoryNamePosition !== 'bottom' && datePosition === 'bottom' && edition && (
          <div className="absolute bottom-1 left-0 right-0 bg-white px-2 py-1" style={{ zIndex: 1 }}>
            <p className="text-xs text-gray-500 text-center">
              {new Date(edition.date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Orange horizontal line at bottom */}
        <div className="w-full h-1 bg-orange-500 absolute bottom-0 left-0" style={{ zIndex: 2 }}></div>

        {/* Render Children - Only if showChildren is true */}
        {showChildren && node.children && node.children.length > 0 && (
          <div className="mt-4 space-y-4">
            {node.children.map(child => renderCategoryCard(child, level + 1, true, 0, 1, perRow, false))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`epaper-featured-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
        {/* Loading removed - content will appear directly */}
      </div>
    );
  }

  if (!config.categoryTree || config.categoryTree.length === 0) {
    return (
      <div className={`epaper-featured-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
        <div className="text-center py-8 text-gray-500">No categories configured</div>
      </div>
    );
  }

  const perRowCount = config.perRowCount || 3;
  
  // Calculate actual categories count for current view
  const currentCategories = currentView === 'groups' ? getRootCategories() : getCitiesForGroup();
  const actualCategoriesCount = currentCategories.length;
  
  // Calculate actual columns needed (responsive)
  const maxColumns = isMobile ? 1 : perRowCount;
  const actualColumns = Math.min(actualCategoriesCount, maxColumns);
  
  const thumbnailWidth = isMobile ? 350 : (config.thumbnailWidth || 180);

  return (
    <div className={`epaper-featured-widget`} style={{width: '100%', maxWidth: '100%', overflow: 'hidden', paddingTop: '16px', paddingBottom: '16px'}}>
      {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
      
      {/* Back Button - Show only in cities view */}
      {currentView === 'cities' && (
        <div className="my-6">
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-red-500 text-white rounded"
            style={{ width: '8%', minWidth: '80px' }}
          >
            {config.backButtonText || 'Back'}
          </button>
        </div>
      )}
      
      <div className={`${isMobile ? "px-4" : ""} ${config.cssClasses || ''}`} style={{width: '100%', ...parseInlineStyle(config.style)}}>
          <div 
            className={isMobile ? "flex flex-col" : "grid"}
            style={isMobile ? {
              gap: '5px'
            } : {
              gridTemplateColumns: `repeat(${actualColumns}, 1fr)`,
              gap: '12px',
            }}
          >
            {currentView === 'groups' ? (
              // State 1: Show root categories (groups)
              getRootCategories().map((node, index) => 
                renderCategoryCard(node, 0, false, index, getRootCategories().length, actualColumns, true)
              )
            ) : (
              // State 2: Show cities for selected group
              getCitiesForGroup().map((node, index) => 
                renderCategoryCard(node, 0, false, index, getCitiesForGroup().length, actualColumns, false)
              )
            )}
          </div>
      </div>
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
