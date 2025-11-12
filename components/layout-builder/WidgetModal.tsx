'use client';

import { useState } from 'react';
import { Widget } from './types';

interface WidgetModalProps {
  widget?: Widget;
  onSelect?: (type: Widget['type']) => void;
  onSave?: (widget: Widget) => void;
  onClose: () => void;
}

export function WidgetModal({ widget, onSelect, onSave, onClose }: WidgetModalProps) {
  const [editedWidget, setEditedWidget] = useState<Widget | null>(widget || null);

  const widgetTypes: Array<{ type: Widget['type']; label: string; icon: string; color: string }> = [
    { type: 'ticker', label: 'Ticker', icon: '📰', color: 'bg-cyan-500' },
    { type: 'social', label: 'Social Widget', icon: '👥', color: 'bg-blue-500' },
    { type: 'image', label: 'Image Widget', icon: '🖼️', color: 'bg-teal-500' },
    { type: 'text', label: 'Text Widget', icon: '📝', color: 'bg-purple-500' },
    { type: 'button', label: 'Button Widget', icon: '🔘', color: 'bg-green-500' },
    { type: 'menu', label: 'Menu Widget', icon: '☰', color: 'bg-orange-500' },
    { type: 'embed', label: 'Embed Widget', icon: '🔗', color: 'bg-pink-500' },
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {widget ? 'Edit Widget' : 'Select Widget Type'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
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

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
