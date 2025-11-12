'use client';

import { useState } from 'react';

interface CustomCodeModalProps {
  css: string;
  js: string;
  onCssChange: (css: string) => void;
  onJsChange: (js: string) => void;
  onClose: () => void;
}

export function CustomCodeModal({ css, js, onCssChange, onJsChange, onClose }: CustomCodeModalProps) {
  const [activeTab, setActiveTab] = useState<'css' | 'js'>('css');
  const [localCss, setLocalCss] = useState(css);
  const [localJs, setLocalJs] = useState(js);

  const handleSave = () => {
    onCssChange(localCss);
    onJsChange(localJs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Custom CSS/JS</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('css')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'css'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom CSS
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'js'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom JavaScript
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'css' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CSS Code (Applied to this layout only)
              </label>
              <textarea
                value={localCss}
                onChange={(e) => setLocalCss(e.target.value)}
                className="w-full h-96 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/* Add your custom CSS here */
.header {
  background-color: #fff;
  padding: 20px;
}"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                JavaScript Code (Runs when this layout loads)
              </label>
              <textarea
                value={localJs}
                onChange={(e) => setLocalJs(e.target.value)}
                className="w-full h-96 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="// Add your custom JavaScript here
console.log('Layout loaded');

document.addEventListener('DOMContentLoaded', function() {
  // Your code here
});"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
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
    </div>
  );
}
