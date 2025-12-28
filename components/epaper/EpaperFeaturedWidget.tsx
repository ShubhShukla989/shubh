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
    shareIconPosition?: string;
    shareIconSize?: number;
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
  console.log('Current view:', currentView);
  console.log('Category tree:', config.categoryTree);

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
    const shareIconPosition = config.shareIconPosition || 'none';
    const shareIconSize = config.shareIconSize || 20;

    if (!category) return null;

    // Calculate border styles for seamless connection
    const isRightEdge = (index + 1) % perRow === 0;
    const isBottomEdge = index >= totalCount - perRow;

    // Always show full category title - no name extraction
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
        className="featured-category-item bg-white border-4 border-gray-800 shadow-xl hover:shadow-2xl hover:border-blue-600 transition-all cursor-pointer transform hover:scale-105"
        style={{ 
          marginLeft: level > 0 ? '20px' : '0',
          width: isMobile ? '100%' : `${thumbnailWidth}px`,
          height: `${thumbnailHeight}px`, // Fixed height for both mobile and desktop
          borderRadius: '12px',
          overflow: 'hidden',
          maxWidth: isMobile ? '350px' : 'none',
          margin: isMobile ? '0 auto' : '0', // Center on mobile
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

            {/* Share Icon */}
            {shareIconPosition !== 'none' && (
              <button
                className={`absolute bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all ${
                  shareIconPosition === 'top-left' ? 'top-2 left-2' :
                  shareIconPosition === 'top-right' ? 'top-2 right-2' :
                  shareIconPosition === 'bottom-left' ? 'bottom-2 left-2' :
                  'bottom-2 right-2'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  if (navigator.share) {
                    navigator.share({
                      title: category.title,
                      url: window.location.origin + getLinkUrl(node.id),
                    });
                  }
                }}
              >
                <svg 
                  width={shareIconSize} 
                  height={shareIconSize} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Category Name Top */}
          {categoryNamePosition === 'top' && (
            <h3 className="font-bold text-lg mb-2 text-gray-800">{category.title}</h3>
          )}

          {/* Category Name Bottom */}
          {categoryNamePosition === 'bottom' && (
            <div className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t-4 border-gray-800">
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
            <div className="absolute top-0 left-0 right-0 bg-white p-3 border-b-4 border-gray-800">
              <h3 className="font-bold text-sm text-gray-800 text-center">{displayTitle}</h3>
              {datePosition === 'top' && edition && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {new Date(edition.date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Link>

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
        <div className="text-center py-8 text-gray-500">Loading categories...</div>
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
  
  // Calculate container width based on actual content - Mobile responsive
  const thumbnailWidth = isMobile ? 350 : (config.thumbnailWidth || 180);
  const gap = 12;
  const padding = isMobile ? 16 : 32; // Less padding on mobile
  const containerWidth = isMobile 
    ? '100%' // Full width on mobile
    : `${(thumbnailWidth * actualColumns) + (gap * (actualColumns - 1)) + padding}px`;

  return (
    <div className={`epaper-featured-widget ${config.cssClasses || ''}`} style={{...parseInlineStyle(config.style), width: '100%', maxWidth: '100%', overflow: 'hidden'}}>
      {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
      
      {/* Back Button - Show only in cities view */}
      {currentView === 'cities' && (
        <div className="mb-4">
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {config.backButtonText || 'Back'}
          </button>
        </div>
      )}
      
      <div className={isMobile ? "px-4" : "flex justify-center"}>
        <div 
          className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}
          style={{
            width: containerWidth,
            height: 'fit-content',
            maxWidth: isMobile ? '100%' : 'none',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <div 
            className={isMobile ? "flex flex-col space-y-4" : "grid"}
            style={isMobile ? {} : {
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
