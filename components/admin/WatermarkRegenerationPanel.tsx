'use client';

import { useState } from 'react';

interface RegenerationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ areaId: number; error: string }>;
}

export function WatermarkRegenerationPanel() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<RegenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(null);

      const watermarkVersion = new Date().toISOString();
      const body: any = { watermarkVersion };
      
      if (categoryId) {
        body.categoryId = parseInt(categoryId);
      }

      const response = await fetch('/api/area-maps/regenerate-watermarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        setProgress(result.data);
      } else {
        setError(result.error || 'Failed to regenerate watermarks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Watermark Regeneration</h2>
      
      <p className="text-gray-600 mb-6">
        Regenerate all area map watermarks with current settings. This process runs in the background
        and may take several minutes for large datasets.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category ID (optional)
        </label>
        <input
          type="number"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Leave empty to regenerate all"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter a category ID to regenerate only area maps for that category
        </p>
      </div>

      <button
        onClick={handleRegenerate}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Regenerating...
          </span>
        ) : (
          'Regenerate Watermarks'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {progress && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">Regeneration Complete!</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{progress.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processed:</span>
                <span className="font-medium">{progress.processed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Successful:</span>
                <span className="font-medium text-green-700">{progress.successful}</span>
              </div>
              {progress.failed > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">Failed:</span>
                  <span className="font-medium text-red-700">{progress.failed}</span>
                </div>
              )}
            </div>
          </div>

          {progress.errors.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 font-medium mb-2">Errors:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {progress.errors.map((err, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">Area {err.areaId}:</span>{' '}
                    <span className="text-gray-600">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800 font-medium mb-2">💡 Tips:</p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Regeneration happens in the background</li>
          <li>Large datasets may take several minutes</li>
          <li>Check server logs for detailed progress</li>
          <li>Images are cached for 3 minutes after generation</li>
        </ul>
      </div>
    </div>
  );
}
