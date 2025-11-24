'use client';

import { useState } from 'react';

interface RowPropertiesModalProps {
  row: any;
  onSave: (properties: any) => void;
  onClose: () => void;
}

export function RowPropertiesModal({ row, onSave, onClose }: RowPropertiesModalProps) {
  const [cssClass, setCssClass] = useState((row as any).cssClass || '');
  const [customStyle, setCustomStyle] = useState((row as any).customStyle || '');
  const [containerWidth, setContainerWidth] = useState((row as any).containerWidth || 'Normal');
  const [contentStretch, setContentStretch] = useState((row as any).contentStretch || 'Normal');

  const handleSave = () => {
    onSave({
      cssClass,
      customStyle,
      containerWidth,
      contentStretch,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Row Properties</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* CSS Class */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              CSS Class
            </label>
            <input
              type="text"
              value={cssClass}
              onChange={(e) => setCssClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter CSS class names"
            />
          </div>

          {/* Custom Style */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Custom Style
            </label>
            <textarea
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Enter custom CSS styles"
            />
          </div>

          {/* Container Width */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Container Width
            </label>
            <select
              value={containerWidth}
              onChange={(e) => setContainerWidth(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Normal">Normal</option>
              <option value="Full Width">Full Width</option>
              <option value="Boxed">Boxed</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Content Stretch */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Content Stretch
            </label>
            <select
              value={contentStretch}
              onChange={(e) => setContentStretch(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Normal">Normal</option>
              <option value="Stretch">Stretch</option>
              <option value="Center">Center</option>
              <option value="Space Between">Space Between</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
