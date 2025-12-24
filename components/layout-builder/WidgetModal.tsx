'use client';

import { useState, useEffect } from 'react';
import { Widget } from './types';
import { MediaBrowserModal } from './MediaBrowserModal';
import { DeviceVisibilitySelector } from './DeviceVisibilitySelector';

// Tree node interface for hierarchical categories
interface TreeNode {
  id: number;
  title: string;
  children?: TreeNode[];
}

// Menu item interface for navigation
interface MenuItem {
  id: string;
  title: string;
  url: string;
  children: MenuItem[];
}

// Epaper Clip and Share Form Component
function EpaperClipShareForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Clip & Share"
        />
      </div>

      {/* Button Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
        <input
          type="text"
          value={config.buttonText || '<i class="fas fa-cut"></i> Clip'}
          onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='<i class="fas fa-cut"></i> Clip'
        />
      </div>

      {/* Zoomable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Zoomable</label>
        <select
          value={config.zoomable !== false ? 'true' : 'false'}
          onChange={(e) => onChange({ ...config, zoomable: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="false">False</option>
          <option value="true">True</option>
        </select>
      </div>

      {/* Drag Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Drag Mode</label>
        <select
          value={config.dragMode || 'none'}
          onChange={(e) => onChange({ ...config, dragMode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="crop">Crop</option>
          <option value="move">Move</option>
        </select>
      </div>

      {/* Share Button Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Share Button Position</label>
        <select
          value={config.shareButtonPosition || 'stick-to-crop-area'}
          onChange={(e) => onChange({ ...config, shareButtonPosition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="stick-to-crop-area">Stick to Crop Area</option>
          <option value="fixed-floating-bottom-right">Fixed Floating - Bottom Right</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="float-right"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 10px;"
        />
      </div>
    </div>
  );
}

// Epaper Display Form Component
function EpaperDisplayForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Epaper Display"
        />
      </div>

      {/* Popup */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Popup</label>
        <select
          value={config.popup || 'dialog'}
          onChange={(e) => onChange({ ...config, popup: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="popup">Popup</option>
          <option value="dialog">Dialog</option>
          <option value="new-tab">New Tab</option>
        </select>
      </div>

      {/* Popup/Dialog Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Popup/Dialog Width</label>
        <input
          type="text"
          value={config.popupWidth || '900'}
          onChange={(e) => onChange({ ...config, popupWidth: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="900"
        />
      </div>

      {/* Popup/Dialog Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Popup/Dialog Height</label>
        <input
          type="text"
          value={config.popupHeight || '600'}
          onChange={(e) => onChange({ ...config, popupHeight: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="600"
        />
      </div>

      {/* Display Navigation Buttons On */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Navigation Buttons On</label>
        <select
          value={config.displayNavigationButtons || 'both'}
          onChange={(e) => onChange({ ...config, displayNavigationButtons: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
          <option value="both">Both Mobile and Desktop</option>
        </select>
      </div>

      {/* Enable Swipe on Navigation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Enable Swipe on Navigation</label>
        <select
          value={config.enableSwipeNavigation || 'enabled'}
          onChange={(e) => onChange({ ...config, enableSwipeNavigation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Enable Swipe to Navigate on Mobile */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Enable Swipe to Navigate on Mobile</label>
        <select
          value={config.enableSwipeOnMobile || 'enabled'}
          onChange={(e) => onChange({ ...config, enableSwipeOnMobile: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="p-2 shadow"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="max-width: 1200px;"
        />
      </div>
    </div>
  );
}

// Epaper Thumb Navigation Form Component
function EpaperThumbNavigationForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Pages"
        />
      </div>

      {/* Thumb Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thumb Width</label>
        <input
          type="number"
          value={config.thumbWidth || 120}
          onChange={(e) => onChange({ ...config, thumbWidth: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="120"
        />
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <select
          value={config.label || 'page-numbers'}
          onChange={(e) => onChange({ ...config, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="page-numbers">Page numbers</option>
          <option value="page-titles">Page Titles</option>
        </select>
      </div>

      {/* Box Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Box Height</label>
        <input
          type="text"
          value={config.boxHeight || '120px'}
          onChange={(e) => onChange({ ...config, boxHeight: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="120px"
        />
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="p-2 shadow"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper PDF Download Form Component
function EpaperPdfDownloadForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Download PDF"
        />
      </div>

      {/* Button Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
        <input
          type="text"
          value={config.buttonText || 'PDF'}
          onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="PDF"
        />
      </div>

      {/* Target */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
        <select
          value={config.target || 'same-window'}
          onChange={(e) => onChange({ ...config, target: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="same-window">Same Window</option>
          <option value="new-window">New Window</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Clip Display Form Component
function EpaperClipDisplayForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Clip Display"
        />
      </div>

      {/* Show Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show Image</label>
        <select
          value={config.showImage !== false ? 'true' : 'false'}
          onChange={(e) => onChange({ ...config, showImage: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      {/* Show URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show URL</label>
        <select
          value={config.showUrl !== false ? 'true' : 'false'}
          onChange={(e) => onChange({ ...config, showUrl: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Social Widget Form Component
function SocialForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share"
        />
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
        <select
          value={config.format || 'format-1'}
          onChange={(e) => onChange({ ...config, format: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="format-1">Format 1 (Solid)</option>
          <option value="format-2">Format 2 (Circular)</option>
          <option value="format-3">Format 3 (Text + Icon)</option>
        </select>
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
        <input
          type="number"
          value={config.size || 20}
          onChange={(e) => onChange({ ...config, size: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="20"
          min="10"
          max="50"
        />
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Zoom Widget Form Component
function EpaperZoomForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Zoom Controls"
        />
      </div>

      {/* Show Labels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show Labels</label>
        <select
          value={config.showLabels !== false ? 'true' : 'false'}
          onChange={(e) => onChange({ ...config, showLabels: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      {/* Orientation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
        <select
          value={config.orientation || 'horizontal'}
          onChange={(e) => onChange({ ...config, orientation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Page Download Form Component
function PageDownloadForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Download PDF"
        />
      </div>

      {/* Button Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
        <input
          type="text"
          value={config.buttonText || 'PDF'}
          onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="PDF"
        />
      </div>

      {/* Target */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
        <select
          value={config.target || 'same-window'}
          onChange={(e) => onChange({ ...config, target: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="same-window">Same Window</option>
          <option value="new-window">New Window</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Pagination Control Form Component
function EpaperPaginationForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Pages"
        />
      </div>

      {/* Pager Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pager Format</label>
        <select
          value={config.pagerFormat || 'pagination-control'}
          onChange={(e) => onChange({ ...config, pagerFormat: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pagination-control">Pagination Control</option>
          <option value="pagination-control-mini">Pagination Control (Mini)</option>
          <option value="dropdown-list-page-numbers">Dropdown List (Page Numbers)</option>
          <option value="dropdown-list-page-titles">Dropdown List (Page Titles)</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Calendar Form Component
function EpaperCalendarForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Calendar"
        />
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
        <select
          value={config.format || 'full-calendar'}
          onChange={(e) => onChange({ ...config, format: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="full-calendar">Full Calendar</option>
          <option value="full-calendar-with-button">Full Calendar with Button</option>
          <option value="button-calendar-with-category">Button Calendar With Category</option>
          <option value="dropdown-calendar">Dropdown Calendar</option>
        </select>
      </div>

      {/* Button Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
        <input
          type="text"
          value={config.buttonLabel || ''}
          onChange={(e) => onChange({ ...config, buttonLabel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="<--Epaper-all--><i> Archive"
        />
      </div>

      {/* Consider Current Epaper Category on Redirection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Consider Current Epaper Category on Redirection</label>
        <select
          value={config.considerCurrentCategory || 'yes'}
          onChange={(e) => onChange({ ...config, considerCurrentCategory: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Archive Page Form Component
function EpaperArchivePageForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Archive"
        />
      </div>

      {/* Per Row Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Per Row Count</label>
        <input
          type="number"
          value={config.perRowCount || 3}
          onChange={(e) => onChange({ ...config, perRowCount: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="3"
        />
      </div>

      {/* Thumbnail Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Width</label>
        <input
          type="number"
          value={config.thumbnailWidth || 350}
          onChange={(e) => onChange({ ...config, thumbnailWidth: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="350"
        />
      </div>

      {/* Thumbnail Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Height</label>
        <input
          type="number"
          value={config.thumbnailHeight || 350}
          onChange={(e) => onChange({ ...config, thumbnailHeight: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="350"
        />
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
        <select
          value={config.format || 'thumb-image-as-background'}
          onChange={(e) => onChange({ ...config, format: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal-thumbnail">Normal Thumbnail</option>
          <option value="cropped-thumbnail">Cropped Thumbnail</option>
          <option value="thumb-image-as-background">Thumb Image As Background</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Featured Editions Form Component
function FeaturedEditionsForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Widget Title
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Featured Editions"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Editions
        </label>
        <input
          type="number"
          value={config.maxEditions || 6}
          onChange={(e) => onChange({ ...config, maxEditions: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          max="20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Width (px)
          </label>
          <input
            type="number"
            value={config.thumbnailWidth || 200}
            onChange={(e) => onChange({ ...config, thumbnailWidth: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail Height (px)
          </label>
          <input
            type="number"
            value={config.thumbnailHeight || 280}
            onChange={(e) => onChange({ ...config, thumbnailHeight: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Editions Per Row
        </label>
        <select
          value={config.perRowCount || 3}
          onChange={(e) => onChange({ ...config, perRowCount: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showDate !== false}
            onChange={(e) => onChange({ ...config, showDate: e.target.checked })}
            className="mr-2"
          />
          Show Publication Date
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showDescription !== false}
            onChange={(e) => onChange({ ...config, showDescription: e.target.checked })}
            className="mr-2"
          />
          Show Description
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSS Classes
        </label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="custom-class another-class"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom CSS Styles
        </label>
        <textarea
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="margin: 20px; padding: 10px;"
        />
      </div>
    </div>
  );
}

// Epaper Featured Categories Form Component
function EpaperFeaturedCategoriesForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryTree, setCategoryTree] = useState<TreeNode[]>(config.categoryTree || []);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update config whenever tree changes
    onChange({ ...config, categoryTree });
  }, [categoryTree]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/epaper/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newNode: TreeNode = {
      id: category.id,
      title: category.title,
      children: []
    };

    if (selectedNodeId === null) {
      // Add as root level
      setCategoryTree([...categoryTree, newNode]);
    } else {
      // Add as child of selected node
      const addToNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === selectedNodeId) {
            return { ...node, children: [...(node.children || []), newNode] };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: addToNode(node.children || []) };
          }
          return node;
        });
      };
      setCategoryTree(addToNode(categoryTree));
    }
  };

  const handleRemoveNode = (nodeId: number) => {
    const removeFromTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(node => node.id !== nodeId).map(node => ({
        ...node,
        children: removeFromTree(node.children || [])
      }));
    };
    setCategoryTree(removeFromTree(categoryTree));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleDragStart = (node: TreeNode) => {
    setDraggedNode(node);
  };

  const handleDropAsChild = (targetNode: TreeNode) => {
    if (!draggedNode || draggedNode.id === targetNode.id) return;

    // Remove dragged node from tree (with all its children)
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(n => n.id !== draggedNode.id).map(n => ({
        ...n,
        children: removeNode(n.children || [])
      }));
    };

    let newTree = removeNode(categoryTree);

    // Add as child of target
    const addToTarget = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === targetNode.id) {
          return { ...node, children: [...(node.children || []), draggedNode] };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: addToTarget(node.children || []) };
        }
        return node;
      });
    };
    newTree = addToTarget(newTree);

    setCategoryTree(newTree);
    setDraggedNode(null);
  };

  const handleDropBefore = (targetNode: TreeNode, parentNodes: TreeNode[] | null) => {
    if (!draggedNode || draggedNode.id === targetNode.id) return;

    // Remove dragged node from tree (with all its children)
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(n => n.id !== draggedNode.id).map(n => ({
        ...n,
        children: removeNode(n.children || [])
      }));
    };

    let newTree = removeNode(categoryTree);

    // Insert before target at the same level
    const insertBefore = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      for (const node of nodes) {
        if (node.id === targetNode.id) {
          result.push(draggedNode);
          result.push(node);
        } else {
          result.push({
            ...node,
            children: insertBefore(node.children || [])
          });
        }
      }
      return result;
    };

    if (parentNodes === null) {
      // Root level
      newTree = insertBefore(newTree);
    } else {
      newTree = insertBefore(newTree);
    }

    setCategoryTree(newTree);
    setDraggedNode(null);
  };

  const handleDropAtEnd = () => {
    if (!draggedNode) return;

    // Remove dragged node from tree
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(n => n.id !== draggedNode.id).map(n => ({
        ...n,
        children: removeNode(n.children || [])
      }));
    };

    let newTree = removeNode(categoryTree);
    newTree = [...newTree, draggedNode];

    setCategoryTree(newTree);
    setDraggedNode(null);
  };

  const getAllNodeIds = (nodes: TreeNode[]): number[] => {
    if (!Array.isArray(nodes)) {
      return [];
    }
    let ids: number[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children && node.children.length > 0) {
        ids = [...ids, ...getAllNodeIds(node.children)];
      }
    });
    return ids;
  };

  const selectedIds = getAllNodeIds(categoryTree || []);
  const availableCategories = categories.filter(c => !selectedIds.includes(c.id));

  const renderTree = (nodes: TreeNode[], level: number = 0): JSX.Element[] => {
    if (!Array.isArray(nodes)) {
      return [];
    }
    const elements: JSX.Element[] = [];
    
    nodes.forEach((node, index) => {
      elements.push(
        <div key={`node-${node.id}`} style={{ marginLeft: `${level * 20}px` }}>
          {/* Drop zone BEFORE this node (for reordering) */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.stopPropagation();
              handleDropBefore(node, null);
            }}
            className="h-2 -mb-1 hover:bg-blue-200 transition-colors"
          />
          
          {/* The node itself */}
          <div className="relative">
            <div
              draggable
              onDragStart={() => handleDragStart(node)}
              onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
              className={`flex items-center justify-between p-2 mb-1 border rounded cursor-move ${
                selectedNodeId === node.id ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {node.children && node.children.length > 0 && <span className="text-gray-500 text-xs">▼</span>}
                <span className="text-sm">{node.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveNode(node.id);
                }}
                className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
              >
                ×
              </button>
            </div>
            
            {/* Drop zone ON this node (to make child) */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation();
                handleDropAsChild(node);
              }}
              className="absolute inset-0 pointer-events-none"
              style={{ 
                pointerEvents: draggedNode && draggedNode.id !== node.id ? 'auto' : 'none',
                border: draggedNode && draggedNode.id !== node.id ? '2px dashed transparent' : 'none'
              }}
              onDragEnter={(e) => {
                if (draggedNode && draggedNode.id !== node.id) {
                  e.currentTarget.style.border = '2px dashed #3b82f6';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.border = '2px dashed transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          </div>
          
          {/* Render children */}
          {node.children && node.children.length > 0 && (
            <div className="mt-1">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
    
    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Featured Categories"
        />
      </div>

      {/* Selected Categories Tree */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Selected Categories</label>
        <div className="flex gap-2 mb-2">
          <select
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            onChange={(e) => {
              if (e.target.value) {
                handleAddCategory(parseInt(e.target.value));
                e.target.value = '';
              }
            }}
          >
            <option value="">-- Select Category --</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const select = document.querySelector('select') as HTMLSelectElement;
              if (select?.value) {
                handleAddCategory(parseInt(select.value));
                select.value = '';
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        <div
          className="min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDropAtEnd();
          }}
        >
          {categoryTree.length === 0 ? (
            <div className="text-sm text-gray-500 italic text-center py-8">
              No categories selected. Select from dropdown and click Add.
            </div>
          ) : (
            <>
              {renderTree(categoryTree || [])}
              {/* Drop zone at the end */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDropAtEnd();
                }}
                className="h-8 mt-2 border-2 border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50 rounded transition-colors flex items-center justify-center text-xs text-gray-400"
              >
                {draggedNode && 'Drop here to add at end'}
              </div>
            </>
          )}
        </div>
        {selectedNodeId && (
          <div className="text-xs text-blue-600 mt-1">
            Selected: {categoryTree.find(n => n.id === selectedNodeId)?.title || 'Category'} - New categories will be added as children
          </div>
        )}
      </div>

      {/* Row 1: Thumbnail Width, Height, Per Row Count */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Width</label>
          <input
            type="number"
            value={config.thumbnailWidth || 300}
            onChange={(e) => onChange({ ...config, thumbnailWidth: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Height</label>
          <input
            type="number"
            value={config.thumbnailHeight || 450}
            onChange={(e) => onChange({ ...config, thumbnailHeight: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Per Row Count</label>
          <input
            type="number"
            value={config.perRowCount || 3}
            onChange={(e) => onChange({ ...config, perRowCount: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Row 2: Crop Thumbnails, Category Name Position, Date Position */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crop Thumbnails</label>
          <select
            value={config.cropThumbnails || 'yes'}
            onChange={(e) => onChange({ ...config, cropThumbnails: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name Position</label>
          <select
            value={config.categoryNamePosition || 'none'}
            onChange={(e) => onChange({ ...config, categoryNamePosition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="none">None</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Position</label>
          <select
            value={config.datePosition || 'none'}
            onChange={(e) => onChange({ ...config, datePosition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="none">None</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>
      </div>

      {/* Row 3: Back Button Text, Share Icon Position, Share Icon Size */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Back Button Text</label>
          <input
            type="text"
            value={config.backButtonText || 'Back'}
            onChange={(e) => onChange({ ...config, backButtonText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Back"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Icon Position</label>
          <select
            value={config.shareIconPosition || 'none'}
            onChange={(e) => onChange({ ...config, shareIconPosition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="none">None</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Icon Size</label>
          <input
            type="number"
            value={config.shareIconSize || 20}
            onChange={(e) => onChange({ ...config, shareIconSize: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Link To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link To</label>
        <select
          value={config.linkTo || 'category-archive'}
          onChange={(e) => onChange({ ...config, linkTo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="category-archive">Category Archive</option>
          <option value="latest-edition">Latest Edition of Category</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>
    </div>
  );
}

// Menu Widget Form Component
function MenuForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const [menus, setMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoadingMenus(true);
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      setMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Menu Title"
        />
      </div>

      {/* Show Title */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.showTitle !== false}
            onChange={(e) => onChange({ ...config, showTitle: e.target.checked })}
          />
          <span className="text-sm font-medium text-gray-700">Show Title</span>
        </label>
      </div>

      {/* Menu Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
        {loadingMenus ? (
          <div className="text-gray-500 py-2">Loading menus...</div>
        ) : (
          <select
            value={config.menuId || ''}
            onChange={(e) => onChange({ ...config, menuId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Menu --</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Display Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Style</label>
        <select
          value={config.displayStyle || 'vertical'}
          onChange={(e) => onChange({ ...config, displayStyle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="vertical">Vertical List</option>
          <option value="horizontal">Horizontal List</option>
          <option value="dropdown">Dropdown Select</option>
        </select>
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="menu-widget sidebar-menu"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px; background: #f8f9fa;"
        />
      </div>
    </div>
  );
}

// Navigation Bar Form Component
function NavigationForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  const [menus, setMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoadingMenus(true);
      const response = await fetch('/api/menu');
      const data = await response.json();
      // API returns data directly, not wrapped in success/data
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      setMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          type="text"
          value={config.logoUrl || ''}
          onChange={(e) => onChange({ ...config, logoUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/logo.png"
        />
      </div>

      {/* Logo Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo Status</label>
        <select
          value={config.logoStatus || 'display-both'}
          onChange={(e) => onChange({ ...config, logoStatus: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hide-desktop">Hide on Desktop</option>
          <option value="hide-mobile">Hide on Mobile</option>
          <option value="display-both">Display On Both</option>
        </select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <input
            type="color"
            value={config.backgroundColor || '#ffffff'}
            onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <input
            type="color"
            value={config.textColor || '#000000'}
            onChange={(e) => onChange({ ...config, textColor: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Menu Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
        {loadingMenus ? (
          <div className="text-gray-500 py-2">Loading menus...</div>
        ) : (
          <select
            value={config.menuId || ''}
            onChange={(e) => onChange({ ...config, menuId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Menu --</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="navbar-dark bg-primary"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 10px; margin-bottom: 20px;"
        />
      </div>
    </div>
  );
}

// Epaper Area Map Display Form Component
function EpaperAreaMapForm({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Area Map Display"
        />
      </div>

      {/* CSS Classes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
        <input
          type="text"
          value={config.cssClasses || ''}
          onChange={(e) => onChange({ ...config, cssClasses: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="text-center"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <input
          type="text"
          value={config.style || ''}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="padding: 20px;"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        <strong>Note:</strong> This widget displays area-mapped images with clickable regions. 
        Area map configuration is managed per page in the page settings.
      </div>
    </div>
  );
}

interface WidgetModalProps {
  widget?: Widget;
  onSelect?: (type: Widget['type']) => void;
  onSave?: (widget: Widget) => void;
  onClose: () => void;
}

export function WidgetModal({ widget, onSelect, onSave, onClose }: WidgetModalProps) {
  const [editedWidget, setEditedWidget] = useState<Widget | null>(widget || null);
  const [sliders, setSliders] = useState<any[]>([]);
  const [loadingSliders, setLoadingSliders] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  // Fetch sliders for slideshow widget
  useEffect(() => {
    if (editedWidget?.type === 'slideshow') {
      fetchSliders();
    }
  }, [editedWidget?.type]);

  const fetchSliders = async () => {
    try {
      setLoadingSliders(true);
      const response = await fetch('/api/sliders');
      const data = await response.json();
      // API returns { sliders: [...] } format
      if (data.sliders) {
        setSliders(data.sliders || []);
      }
    } catch (error) {
      console.error('Error fetching sliders:', error);
    } finally {
      setLoadingSliders(false);
    }
  };

  const widgetTypes: Array<{ type: Widget['type']; label: string; icon: string; color: string }> = [
    { type: 'ticker', label: 'Ticker', icon: '📰', color: 'bg-cyan-500' },
    { type: 'social', label: 'Social Widget', icon: '👥', color: 'bg-blue-500' },
    { type: 'image', label: 'Image Widget', icon: '🖼️', color: 'bg-teal-500' },
    { type: 'text', label: 'Text Widget', icon: '📝', color: 'bg-purple-500' },
    { type: 'button', label: 'Button Widget', icon: '🔘', color: 'bg-green-500' },
    { type: 'menu', label: 'Menu Widget', icon: '☰', color: 'bg-orange-500' },
    { type: 'navigation', label: 'Navigation Bar Widget', icon: '🧭', color: 'bg-slate-600' },
    { type: 'embed', label: 'Embed Widget', icon: '🔗', color: 'bg-pink-500' },
    { type: 'heading', label: 'Heading Widget', icon: '📌', color: 'bg-red-500' },
    { type: 'html', label: 'HTML Widget', icon: '💻', color: 'bg-indigo-500' },
    { type: 'epaper-archive', label: 'Archive Widget', icon: '📚', color: 'bg-purple-800' },
    { type: 'epaper-calendar', label: 'Calendar Widget', icon: '📅', color: 'bg-green-700' },
    { type: 'epaper-pagination', label: 'Pagination Widget', icon: '📄', color: 'bg-blue-800' },
    { type: 'epaper-pdf-download', label: 'PDF Download Widget', icon: '📥', color: 'bg-red-800' },
    { type: 'epaper-thumb-navigation', label: 'Thumb Navigation Widget', icon: '🖼️', color: 'bg-yellow-700' },
    { type: 'epaper-clip-share', label: 'Clip & Share Widget', icon: '✂️', color: 'bg-pink-700' },
    { type: 'epaper-clip-display', label: 'Epaper: Clip Page: Clip Display', icon: '📋', color: 'bg-purple-600' },
    { type: 'epaper-display', label: 'Epaper Display Widget', icon: '📰', color: 'bg-slate-800' },
    { type: 'epaper-zoom', label: 'Zoom Controls Widget', icon: '🔍', color: 'bg-indigo-700' },
    { type: 'social-sharing', label: 'Social Sharing Widget', icon: '🔗', color: 'bg-blue-600' },
    { type: 'epaper-featured', label: 'Featured Categories Widget', icon: '⭐', color: 'bg-cyan-700' },
    { type: 'featured-editions', label: 'Featured Editions Widget', icon: '📰', color: 'bg-green-700' },
    { type: 'page-download', label: 'Page: Download Widget', icon: '📥', color: 'bg-red-600' },
    { type: 'epaper-area-map', label: 'Area Map Display Widget', icon: '🗺️', color: 'bg-amber-700' },
  ];

  const handleSave = () => {
    if (editedWidget && onSave) {
      onSave(editedWidget);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {widget ? `${editedWidget?.type === 'image' ? 'Image Widget' : 'Edit Widget'}` : 'Select Widget Type'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {!widget && onSelect ? (
            <div className="grid grid-cols-2 gap-4">
              {widgetTypes.map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className={`${color} text-white p-6 rounded-lg hover:opacity-90 transition-opacity flex flex-col items-center gap-2`}
                >
                  <span className="text-4xl">{icon}</span>
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          ) : editedWidget ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Widget Type</label>
                <input
                  type="text"
                  value={editedWidget.type}
                  disabled
                  className="w-full px-3 py-2 border rounded bg-gray-100"
                />
              </div>

              {/* Heading Widget - Special Form */}
              {editedWidget.type === 'heading' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editedWidget.config.title || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Heading Text (Leave Blank for Current Page Title)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <select
                      value={editedWidget.config.format || 'h4'}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, format: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="display-1">Display 1</option>
                      <option value="display-2">Display 2</option>
                      <option value="display-3">Display 3</option>
                      <option value="display-4">Display 4</option>
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="h6">H6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Render Tag</label>
                    <select
                      value={editedWidget.config.renderTag || 'h1'}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, renderTag: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="h6">H6</option>
                      <option value="p">Paragraph</option>
                      <option value="div">Div</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
                    <input
                      type="text"
                      value={editedWidget.config.cssClasses || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, cssClasses: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={editedWidget.config.style || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, style: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="color: #333; margin-bottom: 20px;"
                    />
                  </div>
                </div>
              ) : editedWidget.type === 'html' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editedWidget.config.title || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Widget title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTML Code</label>
                    <textarea
                      value={editedWidget.config.html || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, html: e.target.value }
                      })}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="<div>Your HTML code here</div>"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
                    <input
                      type="text"
                      value={editedWidget.config.cssClasses || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, cssClasses: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="text-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={editedWidget.config.style || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, style: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="background-color: #fff; padding: 20px;"
                    />
                  </div>
                </div>
              ) : editedWidget.type === 'image' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={editedWidget.config.title || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image Url</label>
                    <input
                      type="text"
                      value={editedWidget.config.src || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, src: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaBrowser(true)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Media...
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={editedWidget.config.alt || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, alt: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Image description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Url</label>
                    <input
                      type="text"
                      value={editedWidget.config.link || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, link: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Target</label>
                    <select
                      value={editedWidget.config.target || '_self'}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, target: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="_self">Same Window</option>
                      <option value="_blank">New Window</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lazyload</label>
                    <select
                      value={editedWidget.config.lazyload !== false ? 'enabled' : 'disabled'}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, lazyload: e.target.value === 'enabled' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fetch Priority</label>
                    <select
                      value={editedWidget.config.fetchPriority || 'auto'}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, fetchPriority: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
                    <input
                      type="text"
                      value={editedWidget.config.cssClasses || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, cssClasses: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="text-center site-logo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <input
                      type="text"
                      value={editedWidget.config.style || ''}
                      onChange={(e) => setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, style: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="width: 100%; max-width: 500px;"
                    />
                  </div>
                </div>
              ) : editedWidget.type === 'social' ? (
                <SocialForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-clip-share' ? (
                <EpaperClipShareForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-clip-display' ? (
                <EpaperClipDisplayForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-display' ? (
                <EpaperDisplayForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-thumb-navigation' ? (
                <EpaperThumbNavigationForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-pdf-download' ? (
                <EpaperPdfDownloadForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-zoom' ? (
                <EpaperZoomForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'social-sharing' ? (
                <SocialForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'page-download' ? (
                <PageDownloadForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-area-map' ? (
                <EpaperAreaMapForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-pagination' ? (
                <EpaperPaginationForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-calendar' ? (
                <EpaperCalendarForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-archive' ? (
                <EpaperArchivePageForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'epaper-featured' ? (
                <EpaperFeaturedCategoriesForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'featured-editions' ? (
                <FeaturedEditionsForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'menu' ? (
                <MenuForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'navigation' ? (
                <NavigationForm
                  config={editedWidget.config}
                  onChange={(config) => setEditedWidget({ ...editedWidget, config })}
                />
              ) : editedWidget.type === 'slideshow' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Slider</label>
                    {loadingSliders ? (
                      <div className="text-gray-500">Loading sliders...</div>
                    ) : (
                      <select
                        value={editedWidget.config.sliderId || ''}
                        onChange={(e) => {
                          const sliderId = e.target.value ? parseInt(e.target.value) : null;
                          const selectedSlider = sliders.find(s => s.id === sliderId);
                          setEditedWidget({
                            ...editedWidget,
                            config: {
                              ...editedWidget.config,
                              sliderId,
                              sliderAlias: selectedSlider?.alias || null,
                            }
                          });
                        }}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">-- Select a Slider --</option>
                        {sliders.map((slider) => (
                          <option key={slider.id} value={slider.id}>
                            {slider.title} ({slider.alias})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedWidget.config.autoplay !== false}
                          onChange={(e) => setEditedWidget({
                            ...editedWidget,
                            config: { ...editedWidget.config, autoplay: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Autoplay</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedWidget.config.showArrows !== false}
                          onChange={(e) => setEditedWidget({
                            ...editedWidget,
                            config: { ...editedWidget.config, showArrows: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Show Arrows</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedWidget.config.showDots !== false}
                          onChange={(e) => setEditedWidget({
                            ...editedWidget,
                            config: { ...editedWidget.config, showDots: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Show Dots</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Interval (ms)</label>
                      <input
                        type="number"
                        value={editedWidget.config.interval || 5000}
                        onChange={(e) => setEditedWidget({
                          ...editedWidget,
                          config: { ...editedWidget.config, interval: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Default JSON Editor for other widgets */
                <div>
                  <label className="block text-sm font-medium mb-2">Configuration (JSON)</label>
                  <textarea
                    value={JSON.stringify(editedWidget.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        setEditedWidget({ ...editedWidget, config });
                      } catch (err) {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="w-full px-3 py-2 border rounded font-mono text-sm h-64"
                  />
                </div>
              )}

              {/* Device Visibility Selector - Common for all widgets */}
              <DeviceVisibilitySelector
                value={editedWidget.deviceVisibility || 'both'}
                onChange={(value) => setEditedWidget({
                  ...editedWidget,
                  deviceVisibility: value
                })}
              />

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Media Browser Modal */}
      {showMediaBrowser && (
        <MediaBrowserModal
          onSelect={(url) => {
            if (editedWidget) {
              setEditedWidget({
                ...editedWidget,
                config: { ...editedWidget.config, src: url }
              });
            }
            setShowMediaBrowser(false);
          }}
          onClose={() => setShowMediaBrowser(false)}
        />
      )}
    </div>
  );
}
