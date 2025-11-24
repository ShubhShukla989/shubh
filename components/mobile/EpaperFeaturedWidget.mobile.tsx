'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TreeNode {
  id: number;
  title: string;
  children?: TreeNode[];
}

interface EpaperFeaturedWidgetMobileProps {
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
    shareIconPosition?: string;
    shareIconSize?: number;
    linkTo?: string;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperFeaturedWidgetMobile({ config }: EpaperFeaturedWidgetMobileProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [latestEditions, setLatestEditions] = useState<{ [key: number]: any }>({});
  const [loading, setLoading] = useState(true);
  
  // State management for navigation
  const [currentView, setCurrentView] = useState<'groups' | 'cities'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<TreeNode | null>(null);

  useEffect(() => {
    fetchCategoriesData();
  }, [config.categoryTree]);

  const fetchCategoriesData = async () => {
    if (!config.categoryTree || config.categoryTree.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Get all category IDs from tree (including nested)
      const categoryIds = getAllCategoryIds(config.categoryTree);

      // Fetch category details
      const categoriesResponse = await fetch('/api/epaper/categories');
      const categoriesResult = await categoriesResponse.json();
      
      if (categoriesResult.success) {
        const allCategories = categoriesResult.data || [];
        const filteredCategories = allCategories.filter((cat: any) => 
          categoryIds.includes(cat.id)
        );
        setCategories(filteredCategories);

        // Fetch latest edition for each category
        const editionsMap: { [key: number]: any } = {};
        for (const catId of categoryIds) {
          try {
            const editionResponse = await fetch(`/api/editions?category_id=${catId}&limit=1&status=published`);
            const editionResult = await editionResponse.json();
            if (editionResult.success && editionResult.data && editionResult.data.length > 0) {
              editionsMap[catId] = editionResult.data[0];
            }
          } catch (error) {
            console.error(`Failed to fetch edition for category ${catId}:`, error);
          }
        }
        setLatestEditions(editionsMap);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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

  const getCategoryThumbnail = (categoryId: number) => {
    const category = getCategoryData(categoryId);
    
    // First priority: Category image
    if (category && category.image_url) {
      return category.image_url;
    }
    
    // Fallback: Edition thumbnail
    const edition = latestEditions[categoryId];
    if (edition && edition.pages && edition.pages.length > 0) {
      return edition.pages[0].thumbnail_url || edition.pages[0].image_url;
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

  // Get cities for selected group (Primary + Sub categories)
  const getCitiesForGroup = () => {
    if (!selectedGroup) return [];
    
    // Return Primary + All Sub categories together
    return [selectedGroup, ...(selectedGroup.children || [])];
  };

  const renderCategoryCard = (node: TreeNode, isGroupView: boolean = false) => {
    const category = getCategoryData(node.id);
    const thumbnail = getCategoryThumbnail(node.id);
    const edition = latestEditions[node.id];
    
    const cropThumbnails = config.cropThumbnails !== 'no';
    const categoryNamePosition = config.categoryNamePosition || 'bottom';
    const datePosition = config.datePosition || 'none';

    if (!category) return null;

    // Always show full category title
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
        className="featured-category-item bg-white border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-lg overflow-hidden"
        onClick={handleClick}
      >
        <Link href={isGroupView && node.children && node.children.length > 0 ? '#' : getLinkUrl(node.id)} className="block relative group">
          {/* Thumbnail */}
          <div className="relative overflow-hidden w-full aspect-[3/4]">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={category.title}
                fill
                className={cropThumbnails ? 'object-cover' : 'object-contain'}
              />
            ) : (
              <div className="bg-gray-100 flex items-center justify-center text-gray-400 w-full h-full">
                <span className="text-4xl">📰</span>
              </div>
            )}

            {/* Category Name Overlay */}
            {categoryNamePosition === 'overlay' && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <h3 className="text-white font-bold text-xs">{category.title}</h3>
              </div>
            )}

            {/* Date Overlay */}
            {datePosition === 'overlay' && edition && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {new Date(edition.date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Category Name Bottom */}
          {categoryNamePosition === 'bottom' && (
            <div className="p-2 border-t bg-white">
              <h3 className="font-bold text-sm text-gray-800 text-center leading-tight">{displayTitle}</h3>
              {datePosition === 'bottom' && edition && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {new Date(edition.date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Category Name Top */}
          {categoryNamePosition === 'top' && (
            <div className="p-2 border-b">
              <h3 className="font-bold text-xs text-gray-800 text-center">{displayTitle}</h3>
              {datePosition === 'top' && edition && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {new Date(edition.date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`epaper-featured-widget-mobile m-0 p-0 ${config.cssClasses || ''}`} style={{ margin: 0, padding: 0, ...parseInlineStyle(config.style) }}>
        {config.title && <h2 className="text-lg font-bold my-2 text-center px-3">{config.title}</h2>}
        <div className="text-center py-4 text-gray-500">Loading categories...</div>
      </div>
    );
  }

  if (!config.categoryTree || config.categoryTree.length === 0) {
    return (
      <div className={`epaper-featured-widget-mobile m-0 p-0 ${config.cssClasses || ''}`} style={{ margin: 0, padding: 0, ...parseInlineStyle(config.style) }}>
        {config.title && <h2 className="text-lg font-bold my-2 text-center px-3">{config.title}</h2>}
        <div className="text-center py-4 text-gray-500">No categories configured</div>
      </div>
    );
  }

  return (
    <div className={`epaper-featured-widget-mobile m-0 ${config.cssClasses || ''}`} style={{ margin: 0, padding: 0, ...parseInlineStyle(config.style) }}>
      {config.title && <h2 className="text-lg font-bold mb-2 mt-2 text-center px-3" style={{ color: '#dc2626', margin: '0.5rem 0' }}>{config.title}</h2>}
      
      {/* Back Button - Show only in cities view */}
      {currentView === 'cities' && (
        <div className="mb-2 px-3">
          <button
            onClick={handleBackClick}
            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {config.backButtonText || 'Back'}
          </button>
        </div>
      )}
      
      <div className="px-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {currentView === 'groups' ? (
            // State 1: Show root categories (groups)
            getRootCategories().map((node) => 
              renderCategoryCard(node, true)
            )
          ) : (
            // State 2: Show cities for selected group
            getCitiesForGroup().map((node) => 
              renderCategoryCard(node, false)
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