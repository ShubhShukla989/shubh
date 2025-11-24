'use client';

import { Widget } from './types';

interface WidgetComponentProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function WidgetComponent({ widget, onEdit, onDelete, onDuplicate, onDragStart, onDragEnd }: WidgetComponentProps) {
  const getWidgetLabel = () => {
    switch (widget.type) {
      case 'ticker': return 'Ticker';
      case 'social': return 'SocialWidget';
      case 'image': return 'ImageWidget';
      case 'text': return 'TextWidget';
      case 'button': return 'ButtonWidget';
      case 'menu': return 'MenuWidget';
      case 'embed': return 'EmbedWidget';
      case 'html': return 'HTMLWidget';
      case 'navigation': return 'NavigationWidget';
      case 'slideshow': return 'SlideshowWidget';
      case 'tinymce': return 'TinyMCEWidget';
      case 'page-content': return 'PageWidget';
      case 'infobox': return 'InfoBoxWidget';
      case 'cards': return 'CardsWidget';
      case 'heading': return 'HeadingWidget';
      case 'video': return 'VideoWidget';
      case 'audio': return 'AudioWidget';
      case 'datetime': return 'DateTimeWidget';
      case 'reusable': return 'ReusableWidget';
      case 'epaper-category': return 'FeaturedCategoryWidget';
      case 'epaper-gallery': return 'GalleryWidget';
      case 'epaper-featured': return 'FeaturedWidget';
      case 'epaper-archive': return 'ArchiveWidget';
      case 'epaper-calendar': return 'CalendarWidget';
      case 'epaper-pagination': return 'PaginationWidget';
      case 'epaper-pdf-download': return 'PDFDownloadWidget';
      case 'epaper-thumb-navigation': return 'ThumbNavigationWidget';
      case 'epaper-clip-share': return 'ClipShareWidget';
      case 'epaper-display': return 'EpaperDisplayWidget';
      case 'pwa-install': return 'PWAInstallWidget';
      case 'youtube': return 'YouTubeWidget';
      case 'rss': return 'RSSWidget';
      default: return 'Widget';
    }
  };

  const getWidgetColor = () => {
    switch (widget.type) {
      case 'ticker': return 'bg-cyan-500';
      case 'social': return 'bg-blue-500';
      case 'image': return 'bg-teal-500';
      case 'text': return 'bg-purple-500';
      case 'button': return 'bg-green-500';
      case 'menu': return 'bg-orange-500';
      case 'embed': return 'bg-pink-500';
      case 'html': return 'bg-indigo-500';
      case 'navigation': return 'bg-blue-600';
      case 'slideshow': return 'bg-purple-600';
      case 'tinymce': return 'bg-yellow-500';
      case 'page-content': return 'bg-gray-600';
      case 'infobox': return 'bg-cyan-600';
      case 'cards': return 'bg-pink-600';
      case 'heading': return 'bg-red-500';
      case 'video': return 'bg-red-600';
      case 'audio': return 'bg-green-600';
      case 'datetime': return 'bg-blue-700';
      case 'reusable': return 'bg-purple-700';
      case 'epaper-category': return 'bg-orange-600';
      case 'epaper-gallery': return 'bg-teal-600';
      case 'epaper-featured': return 'bg-cyan-700';
      case 'epaper-archive': return 'bg-purple-800';
      case 'epaper-calendar': return 'bg-green-700';
      case 'epaper-pagination': return 'bg-blue-800';
      case 'epaper-pdf-download': return 'bg-red-800';
      case 'epaper-thumb-navigation': return 'bg-yellow-700';
      case 'epaper-clip-share': return 'bg-pink-700';
      case 'epaper-display': return 'bg-slate-800';
      case 'pwa-install': return 'bg-indigo-600';
      case 'youtube': return 'bg-red-700';
      case 'rss': return 'bg-orange-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className="rounded bg-white p-2 flex items-center justify-between group hover:shadow-md transition-all cursor-move border border-gray-200"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart();
      }}
      onDragEnd={(e) => {
        if (onDragEnd) onDragEnd();
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 ${getWidgetColor()} text-white rounded text-xs font-medium`}>
          {getWidgetLabel()}
        </span>
      </div>
      
      <div className="flex gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 shadow-sm transition-all"
          title="Duplicate"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 shadow-sm transition-all"
          title="Edit"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm transition-all"
          title="Delete"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
