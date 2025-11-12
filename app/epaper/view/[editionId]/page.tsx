'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EpaperHeader from '@/components/epaper/EpaperHeader';
import PageViewer from '@/components/epaper/PageViewer';
import PageThumbnails from '@/components/epaper/PageThumbnails';
import ShareModal from '@/components/epaper/ShareModal';

interface Page {
  number: number;
  imageUrl: string;
}

interface Edition {
  id: number;
  title: string;
  date: string;
  pdf_url?: string;
}

export default function EpaperViewer() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.editionId as string;
  
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isClipping, setIsClipping] = useState(false);
  const [clippedImage, setClippedImage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadEdition();
    loadPages();
  }, [editionId]);

  const loadEdition = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setEdition(data.data);
      }
    } catch (error) {
      console.error('Failed to load edition:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!edition) return;
    
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.pdf_url) {
        // Open PDF in new tab or download
        window.open(data.data.pdf_url, '_blank');
      } else {
        alert('PDF not available for this edition');
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'c' || e.key === 'C') setIsClipping(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, zoom]);

  const loadPages = async () => {
    setLoading(true);
    
    try {
      // Fetch pages from your database
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Map your database pages to viewer format
        const loadedPages: Page[] = data.data.map((p: any) => ({
          number: p.page_number,
          imageUrl: p.image_url || `/media/epaper/${editionId}/page-${p.page_number}.jpg`,
          id: p.id
        })).sort((a: Page, b: Page) => a.number - b.number);
        
        setPages(loadedPages);
      } else {
        // Fallback: generate mock pages if no pages in database
        const mockPages: Page[] = Array.from({ length: 12 }, (_, i) => ({
          number: i + 1,
          imageUrl: `/media/epaper/${editionId}/page-${i + 1}.jpg`
        }));
        setPages(mockPages);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
      // Fallback to mock data
      const mockPages: Page[] = Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        imageUrl: `/media/epaper/${editionId}/page-${i + 1}.jpg`
      }));
      setPages(mockPages);
    }
    
    setLoading(false);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  const handleClipComplete = (imageData: string) => {
    setClippedImage(imageData);
    setIsClipping(false);
    setShowShareModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Container with max width and centered */}
      <div className="max-w-[1100px] mx-auto w-full bg-white shadow-lg">
        <EpaperHeader
          editionId={editionId}
          currentPage={currentPage}
          totalPages={pages.length}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onClipStart={() => setIsClipping(true)}
          onShare={() => setShowShareModal(true)}
          onPageChange={setCurrentPage}
          onDownloadPDF={handleDownloadPDF}
          editionTitle={edition?.title}
          editionDate={edition?.date}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Thumbnail Sidebar */}
          <PageThumbnails
            pages={pages}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Edition Title */}
            {edition && (
              <div className="bg-white border-b border-gray-200 py-4 px-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                  {edition.title} - {formatDate(edition.date)} - Page {currentPage}
                </h1>
              </div>
            )}

            {/* Main Viewer */}
            <PageViewer
              page={pages[currentPage - 1]}
              zoom={zoom}
              isClipping={isClipping}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onClipComplete={handleClipComplete}
              onClipCancel={() => setIsClipping(false)}
              loading={loading}
              editionId={editionId}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareModal
          clippedImage={clippedImage}
          editionId={editionId}
          pageNumber={currentPage}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
