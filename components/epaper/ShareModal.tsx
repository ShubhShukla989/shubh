'use client';

import { X, Download, ExternalLink } from 'lucide-react';
import { ClipProvider } from '@/contexts/ClipContext';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

interface ShareModalProps {
  clippedImage: string | null;
  editionId: string;
  pageNumber: number;
  onClose: () => void;
}

export default function ShareModal({
  clippedImage,
  editionId,
  pageNumber,
  onClose
}: ShareModalProps) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/epaper/view/${editionId}?page=${pageNumber}`;

  const handleDownload = () => {
    if (!clippedImage) return;
    
    const link = document.createElement('a');
    link.href = clippedImage;
    link.download = `clip-${editionId}-page-${pageNumber}.png`;
    link.click();
  };

  const handleOpen = () => {
    window.open(shareUrl, '_blank');
  };

  const handleShare = async (platform: string) => {
    const text = 'Check out this article from Do Boje Dopahar';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodedText}&body=${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in my-4 md:my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - FIXED */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Share It</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Dynamic Content - Admin Controlled via "Epaper Clip" Layout */}
        <div className="p-5">
          <ClipProvider
            clipImage={clippedImage}
            clipUrl={shareUrl}
            editionId={editionId}
            pageNumber={pageNumber}
          >
            <LayoutRenderer layoutName="Epaper Clip" />
          </ClipProvider>
        </div>

        {/* Footer - FIXED */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-5">
            <button
              onClick={handleOpen}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Open
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
