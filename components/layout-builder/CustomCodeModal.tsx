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
  const [localCss, setLocalCss] = useState(css);
  const [localJs, setLocalJs] = useState(js);

  const handleSave = () => {
    onCssChange(localCss);
    onJsChange(localJs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-800">Custom CSS/JS</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-6 h-6 flex items-center justify-center"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Info Text */}
        <div className="px-4 py-2 bg-gray-50">
          <p className="text-xs text-gray-600">
            Don't forget to use &lt;style&gt; ... &lt;/style&gt; and &lt;script&gt; ... &lt;/script&gt; tags
          </p>
        </div>

        {/* Content Area */}
        <div className="p-4 bg-white">
          <textarea
            value={localCss + '\n\n' + localJs}
            onChange={(e) => {
              const content = e.target.value;
              setLocalCss(content);
              setLocalJs('');
            }}
            className="w-full h-64 px-3 py-2 border-2 border-blue-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
            placeholder="<style>
  /* Your CSS here */
</style>

<script>
  // Your JavaScript here
</script>"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-white border-t flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
