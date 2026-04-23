'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { shareOnWhatsApp } from '@/lib/whatsappShare';

export interface ClipData {
  id: number;
  image_url: string;
  clip_url: string;
  edition_id: number;
  page_number: number;
  created_at: string;
  edition?: {
    id: number;
    title: string;
    date: string;
    category_id: number | null;
  };
}

export default function ClipViewer({ clip }: { clip: ClipData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  const openModal = () => { setIsZoomed(false); setIsModalOpen(true); };
  const closeModal = () => { setIsZoomed(false); setIsModalOpen(false); };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = clip.image_url;
    link.download = `clip-${clip.id}.png`;
    link.click();
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out this article from ${clip.edition?.title || 'Epaper'}`;

    if (platform === 'native') {
      if (navigator.share) {
        try {
          const response = await fetch(clip.image_url);
          const blob = await response.blob();
          const file = new File([blob], `clip-${clip.id}.png`, { type: 'image/png' });
          await navigator.share({ title: text, url, files: [file] });
          return;
        } catch {}
      }
      try { await navigator.clipboard.writeText(url); } catch {}
      return;
    }

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    if (platform === 'whatsapp') { shareOnWhatsApp(text + ': ' + url); return; }
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-8">
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <img
              src={clip.image_url}
              alt="Clip"
              className="rounded-lg shadow-lg w-full h-auto block cursor-zoom-in"
              onClick={openModal}
              draggable={false}
            />
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            onClick={closeModal}
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl"
              style={{ width: '95vw', maxWidth: '1200px', height: 'min(92vh, 100dvh)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 z-10 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
              <div
                className="modal-scroll"
                style={{ flex: 1, overflow: 'scroll', cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                onClick={() => setIsZoomed(p => !p)}
              >
                <img
                  src={clip.image_url}
                  alt="Clip"
                  className="rounded-2xl block"
                  style={{ width: isZoomed ? '200%' : '100%', maxWidth: isZoomed ? 'none' : '100%', height: 'auto', transition: 'width 0.3s ease' }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-[10px] mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Share this article</h3>
          <div className="flex justify-center gap-1 pb-2" style={{ flexWrap: 'wrap' }}>
            <button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="w-12 h-12 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="Copy Link" style={{ minWidth: '48px', backgroundColor: copied ? '#10b981' : '#f97316' }}>
              {copied
                ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              }
            </button>
            <button onClick={() => handleShare('facebook')} className="w-12 h-12 bg-[#3b5998] hover:bg-[#2d4373] text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="Facebook" style={{ minWidth: '48px' }}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button onClick={() => handleShare('twitter')} className="w-12 h-12 bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="X (Twitter)" style={{ minWidth: '48px' }}>
              <span className="text-lg font-bold">𝕏</span>
            </button>
            <button onClick={() => handleShare('whatsapp')} className="w-12 h-12 bg-[#25d366] hover:bg-[#1da851] text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="WhatsApp" style={{ minWidth: '48px' }}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/></svg>
            </button>
            <button onClick={() => handleShare('telegram')} className="w-12 h-12 bg-[#0088cc] hover:bg-[#006699] text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="Telegram" style={{ minWidth: '48px' }}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </button>
            <button onClick={() => {}} className="w-12 h-12 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', minWidth: '48px' }} title="Instagram">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button onClick={() => handleShare('linkedin')} className="w-12 h-12 bg-[#0077b5] hover:bg-[#005582] text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="LinkedIn" style={{ minWidth: '48px' }}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </button>
            <button onClick={handleDownload} className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="Download" style={{ minWidth: '48px' }}>
              <Download className="w-6 h-6" />
            </button>
            <button onClick={() => handleShare('native')} className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0" title="Share" style={{ minWidth: '48px' }}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
