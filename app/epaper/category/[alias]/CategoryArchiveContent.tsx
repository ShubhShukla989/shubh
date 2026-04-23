'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { EpaperCalendarWidget } from '@/components/epaper/EpaperCalendarWidget';

interface Edition {
  id: string;
  date: string;
  title: string;
  totalPages: number;
  thumbnail: string;
  month: string;
  year: string;
}

interface Category {
  id: number;
  title: string;
  alias: string;
  archive_layout?: string | null;
}

export function CategoryArchiveContent({ category }: { category: Category }) {
  const router = useRouter();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [titleWidth, setTitleWidth] = useState(250); // Default width
  const [isMobile, setIsMobile] = useState(false);
  
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 9;

  // Mobile detection + title width — single resize listener
  useEffect(() => {
    const updateLayout = () => {
      setIsMobile(window.innerWidth <= 768);
      const titleElement = document.getElementById('category-archive-title');
      if (titleElement) {
        setTitleWidth(Math.min(titleElement.offsetWidth, window.innerWidth * 0.8));
      }
    };

    updateLayout();
    const timer = setTimeout(updateLayout, 100); // after DOM settles
    window.addEventListener('resize', updateLayout);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLayout);
    };
  }, [category]);

  useEffect(() => {
    loadEditions();
  }, [category.id, currentPage]);

  const loadEditions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/epaper/editions-by-category?category_id=${category.id}&page=${currentPage}&limit=9`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const loadedEditions: Edition[] = data.data.map((e: any) => {
          const date = new Date(e.date);
          return {
            id: e.id.toString(),
            date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            title: e.title,
            totalPages: e.totalPages || 0,
            thumbnail: e.thumbnail || '/images/epaper-placeholder.svg',
            month: date.toLocaleDateString('en-US', { month: 'long' }),
            year: date.getFullYear().toString(),
          };
        });
        setEditions(loadedEditions);
        setTotalPages(data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('Failed to load editions:', error);
    }
    setLoading(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="bg-gray-50">
        {/* Page Header with decorative line */}
        <div className="container mx-auto px-4 py-4">
        <h1 
          id="category-archive-title"
          className="text-2xl font-bold text-gray-900 mb-1"
          style={{ 
            textAlign: 'left',
            display: 'inline-block' // Make it inline-block to get natural width
          }}
        >
          {category.title} - Archives
        </h1>
        {/* Same line design as StaticEpaperLayout - Orange + Grey */}
        <div className="relative w-full">
          {/* Thin grey line as background */}
          <div className="w-full h-0.5 bg-gray-300"></div>
          {/* Bold orange line at beginning - dynamic width based on text */}
          <div 
            className="absolute top-0 bg-orange-500 h-1" 
            style={{ 
              left: '0px',
              width: `${titleWidth}px`, // Dynamic width based on text
              minWidth: '100px', // Minimum width
              transition: 'width 0.3s ease' // Smooth transition
            }}
          ></div>
        </div>

      {/* Main Content Area - exactly 3px gap from header */}
      <div className="container mx-auto px-4" style={{ marginTop: '3px' }}>
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white shadow-lg animate-pulse">
                <div className="bg-gray-200 h-80"></div>
                <div className="p-4 pb-6">
                  <div className="bg-gray-200 h-4 mb-2"></div>
                  <div className="bg-gray-200 h-4 mb-2"></div>
                  <div className="bg-gray-200 h-3 w-2/3"></div>
                </div>
              </div>
            ))}
            {/* Calendar placeholder in loading state */}
            <div className="bg-gray-200 animate-pulse" style={{ width: '250px', height: '250px' }}></div>
          </div>
        ) : editions.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No editions found</h3>
            <p className="text-gray-600 mb-4">No editions available for this category</p>
          </div>
        ) : (
          <>
            {/* Mobile Layout: 1 card per row, max 9 cards, then calendar, then pagination */}
            {isMobile ? (
              <div className="space-y-4">
                {/* Cards - 1 per row */}
                <div className="grid grid-cols-1 gap-4">
                  {editions.map((edition) => (
                    <div key={edition.id} className="relative">
                      <div
                        className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
                        onClick={() => router.push(`/epaper/view/${edition.id}`)}
                        style={{ 
                          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1), -2px 0 8px rgba(0, 0, 0, 0.1), 2px 0 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {/* 4px margin container */}
                        <div style={{ margin: '4px' }}>
                          {/* Newspaper Image with proper 1:1.414 ratio */}
                          <div className="relative overflow-hidden">
                            <img
                              src={edition.thumbnail}
                              alt={`${category.title} - ${edition.date}`}
                              className="w-full object-cover"
                              style={{ aspectRatio: '1 / 1.414' }}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/epaper-placeholder.svg';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          
                          {/* Card Content - left aligned with image */}
                          <div className="text-left mt-2">
                            <div className="py-2">
                              {/* Category Name - Blue, left aligned */}
                              <h3 className="text-blue-600 font-semibold text-sm mb-1 line-clamp-1 text-left">
                                {category.title}
                              </h3>
                              
                              {/* Edition Date - Black, left aligned */}
                              <p className="text-gray-900 font-medium text-base mb-1 text-left">
                                {edition.date}
                              </p>
                              
                              {/* Category Title - Gray, left aligned */}
                              <p className="text-gray-500 text-sm line-clamp-1 text-left">
                                {category.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Orange line outside the box */}
                      <div className="w-full h-1 bg-orange-500 mt-1"></div>
                    </div>
                  ))}
                </div>

                {/* Calendar Widget - Full width on mobile */}
                <div className="flex justify-center mt-6 mb-6">
                  <div className="w-full max-w-sm">
                    <EpaperCalendarWidget 
                      config={{
                        format: "full-calendar",
                        considerCurrentCategory: "yes"
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Layout: Responsive grid to prevent overlay */
              <>
                {/* Responsive grid: 3 cards + 1 calendar, but stack on smaller screens */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                  {/* Cards - All cards in one column on smaller screens */}
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {editions.map((edition) => (
                      <div key={edition.id} className="relative">
                        <div
                          className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group"
                          onClick={() => router.push(`/epaper/view/${edition.id}`)}
                          style={{ 
                            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1), -2px 0 8px rgba(0, 0, 0, 0.1), 2px 0 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {/* 4px margin container */}
                          <div style={{ margin: '4px' }}>
                            {/* Newspaper Image with proper 1:1.414 ratio - Optimized */}
                            <div className="relative overflow-hidden">
                              <img
                                src={edition.thumbnail}
                                alt={`${category.title} - ${edition.date}`}
                                className="w-full object-cover"
                                style={{ aspectRatio: '1 / 1.414' }}
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/epaper-placeholder.svg';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            {/* Card Content - left aligned with image */}
                            <div className="text-left mt-2">
                              <div className="py-2">
                                {/* Category Name - Blue, left aligned */}
                                <h3 className="text-blue-600 font-semibold text-sm mb-1 line-clamp-1 text-left">
                                  {category.title}
                                </h3>
                                
                                {/* Edition Date - Black, left aligned */}
                                <p className="text-gray-900 font-medium text-base mb-1 text-left">
                                  {edition.date}
                                </p>
                                
                                {/* Category Title - Gray, left aligned */}
                                <p className="text-gray-500 text-sm line-clamp-1 text-left">
                                  {category.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Orange line outside the box */}
                        <div className="w-full h-1 bg-orange-500 mt-1"></div>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Widget - Separate column, responsive */}
                  <div className="lg:col-span-1 flex justify-center lg:justify-start items-start">
                    {/* Calendar container - responsive size */}
                    <div style={{ 
                      width: '100%',
                      maxWidth: '280px',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <EpaperCalendarWidget 
                        config={{
                          format: "full-calendar",
                          considerCurrentCategory: "yes"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pagination - Responsive for mobile */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center">
                <div className={`inline-flex items-center ${isMobile ? 'flex-wrap gap-1' : ''}`} style={{ gap: isMobile ? '4px' : '0' }}>
                  {/* First Page Arrow (◄◄) - Small Square */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} flex items-center justify-center bg-white text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold`}
                    style={{ borderRadius: '0', border: '2px solid #dc2626' }}
                  >
                    ◄◄
                  </button>
                  
                  {/* Previous Text - Rectangular */}
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className={`${isMobile ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium`}
                    style={{ borderRadius: '0', border: '2px solid #d1d5db' }}
                  >
                    {isMobile ? 'Prev' : 'Previous'}
                  </button>
                  
                  {/* Page Numbers (Smart Pagination - max 5 pages) - Small Squares */}
                  {(() => {
                    const getSmartPageNumbers = (current: number, total: number): number[] => {
                      if (total <= 5) {
                        return Array.from({ length: total }, (_, i) => i + 1);
                      }
                      
                      let start = current - 2;
                      let end = current + 2;
                      
                      if (start < 1) {
                        const offset = 1 - start;
                        start = 1;
                        end = Math.min(total, end + offset);
                      }
                      
                      if (end > total) {
                        const offset = end - total;
                        end = total;
                        start = Math.max(1, start - offset);
                      }
                      
                      const pages: number[] = [];
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }
                      
                      while (pages.length < 5 && pages.length < total) {
                        if (pages[0] > 1) {
                          pages.unshift(pages[0] - 1);
                        } else if (pages[pages.length - 1] < total) {
                          pages.push(pages[pages.length - 1] + 1);
                        } else {
                          break;
                        }
                      }
                      
                      return pages;
                    };
                    
                    const smartPageNumbers = getSmartPageNumbers(currentPage, totalPages);
                    
                    return smartPageNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} flex items-center justify-center font-bold transition-colors ${
                          pageNum === currentPage
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-red-600 hover:bg-red-50'
                        }`}
                        style={{ 
                          borderRadius: '0', 
                          border: '2px solid #dc2626'
                        }}
                      >
                        {pageNum}
                      </button>
                    ));
                  })()}
                  
                  {/* Next Text - Rectangular */}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className={`${isMobile ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium`}
                    style={{ borderRadius: '0', border: '2px solid #d1d5db' }}
                  >
                    Next
                  </button>
                  
                  {/* Last Page Arrow (►►) - Small Square */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} flex items-center justify-center bg-white text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-bold`}
                    style={{ borderRadius: '0', border: '2px solid #dc2626' }}
                  >
                    ►►
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}