'use client';

import { useState } from 'react';

interface ColumnProperties {
  extraSmallWidth: string;
  smallWidth: string;
  mediumWidth: string;
  largeWidth: string;
  extraLargeWidth: string;
  cssClass: string;
  customStyle: string;
}

interface ColumnPropertiesModalProps {
  properties: ColumnProperties;
  onSave: (properties: ColumnProperties) => void;
  onClose: () => void;
}

export function ColumnPropertiesModal({ properties, onSave, onClose }: ColumnPropertiesModalProps) {
  const [formData, setFormData] = useState<ColumnProperties>(properties);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Column Properties</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Extra Small Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Small Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.extraSmallWidth}
                onChange={(e) => setFormData({ ...formData, extraSmallWidth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Small Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Small Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.smallWidth}
                onChange={(e) => setFormData({ ...formData, smallWidth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Medium Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medium Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.mediumWidth}
                onChange={(e) => setFormData({ ...formData, mediumWidth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Large Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Large Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.largeWidth}
                onChange={(e) => setFormData({ ...formData, largeWidth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Extra Large Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Large Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.extraLargeWidth}
                onChange={(e) => setFormData({ ...formData, extraLargeWidth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CSS Class */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSS Class
            </label>
            <input
              type="text"
              value={formData.cssClass}
              onChange={(e) => setFormData({ ...formData, cssClass: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="custom-class another-class"
            />
          </div>

          {/* Custom Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Style
            </label>
            <textarea
              value={formData.customStyle}
              onChange={(e) => setFormData({ ...formData, customStyle: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="background-color: #f0f0f0;&#10;padding: 20px;"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
