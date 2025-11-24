'use client';

import { useState } from 'react';
import { X, Download, ExternalLink, Mail } from 'lucide-react';

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
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/epaper/view/${editionId}`;

  const handleDownload = () => {
    if (!clippedImage) return;
    
    const link = document.createElement('a');
    link.href = clippedImage;
    link.download = `dbd-${editionId}-page-${pageNumber}.png`;
    link.click();
    
    showToast('Clip downloaded successfully!');
  };

  // Convert base64 to blob for sharing
  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleShareImage = async () => {
    if (!clippedImage) {
      showToast('No image to share');
      return;
    }

    try {
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare) {
        const blob = dataURLtoBlob(clippedImage);
        const file = new File([blob], `dbd-${editionId}-page-${pageNumber}.png`, { type: 'image/png' });
        
        const shareData = {
          files: [file],
          title: 'Do Boje Dopahar',
          text: 'Check out this article from Do Boje Dopahar'
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast('Shared successfully!');
          return;
        }
      }
      
      // Fallback: Download the image
      handleDownload();
      showToast('Image downloaded! You can now share it manually.');
    } catch (error) {
      console.error('Error sharing:', error);
      // If user cancels, don't show error
      if ((error as Error).name !== 'AbortError') {
        handleDownload();
        showToast('Image downloaded! You can now share it manually.');
      }
    }
  };

  // Generic share function that uses Web Share API
  const shareImage = async () => {
    if (!clippedImage) return;
    
    try {
      const blob = dataURLtoBlob(clippedImage);
      const file = new File([blob], `dbd-${editionId}-page-${pageNumber}.png`, { type: 'image/png' });
      
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare) {
        const shareData = {
          files: [file],
          title: 'Do Boje Dopahar',
          text: 'Check out this article from Do Boje Dopahar'
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast('Shared successfully!');
          return true;
        }
      }
      
      // Fallback: Download the image
      handleDownload();
      showToast('Image downloaded! Please share it manually.');
      return false;
    } catch (error) {
      console.error('Error sharing:', error);
      // If user cancels, don't show error
      if ((error as Error).name !== 'AbortError') {
        handleDownload();
        showToast('Image downloaded! Please share it manually.');
      }
      return false;
    }
  };

  const handleShareWhatsApp = () => shareImage();
  const handleShareFacebook = () => shareImage();
  const handleShareTwitter = () => shareImage();
  const handleShareEmail = () => shareImage();

  const handleOpen = () => {
    window.open(shareUrl, '_blank');
  };

  const showToast = (message: string) => {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Share It</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Preview Image */}
          {clippedImage && (
            <div className="mb-5">
              <img
                src={clippedImage}
                alt="Clipped article"
                className="w-full rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          )}

          {/* URL Box */}
          <div className="mb-5">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-red-500 rounded-lg">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
          </div>

          {/* Social Media Icons - 4 in a row */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <button
              onClick={handleShareFacebook}
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Share on Facebook"
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center p-4 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
              title="Share on Twitter"
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center p-4 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              title="Share on WhatsApp"
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </button>

            <button
              onClick={handleShareEmail}
              className="flex items-center justify-center p-4 bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
              title="Share via Email"
            >
              <Mail className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Action Buttons - 2 in a row */}
          <div className="grid grid-cols-2 gap-3">
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
