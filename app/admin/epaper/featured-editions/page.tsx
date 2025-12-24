'use client';

import { useState, useEffect } from 'react';
import { Minus } from 'lucide-react';
import { Edition } from '@/lib/types';
import PDFThumbnail from '@/components/PDFThumbnail';

interface EditionWithPages extends Edition {
  firstPageImage?: string;
}

export default function FeaturedEditionsPage() {
  const [editions, setEditions] = useState<EditionWithPages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEditions();
  }, []);

  const fetchFeaturedEditions = async () => {
    try {
      // Fetch ALL editions that are marked as featured (regardless of status)
      const response = await fetch('/api/editions');
      const result = await response.json();
      if (result.success) {
        // Filter only featured editions
        const editionsData = (result.data || []).filter((e: Edition) => e.is_featured);
        
        // Fetch first page image for each edition
        const editionsWithImages = await Promise.all(
          editionsData.map(async (edition: Edition) => {
            try {
              const pagesResponse = await fetch(`/api/editions/${edition.id}/pages`);
              const pagesResult = await pagesResponse.json();
              if (pagesResult.success && pagesResult.data && pagesResult.data.length > 0) {
                return {
                  ...edition,
                  firstPageImage: pagesResult.data[0].image_url,
                };
              }
            } catch (error) {
              console.error('Failed to fetch pages for edition:', edition.id);
            }
            return edition;
          })
        );
        
        setEditions(editionsWithImages);
      }
    } catch (error) {
      console.error('Failed to fetch featured editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFeatured = async (id: number, title: string) => {
    if (!confirm(`Remove "${title}" from featured editions?`)) return;

    try {
      const getResponse = await fetch(`/api/editions/${id}`);
      const getResult = await getResponse.json();
      
      if (!getResult.success) {
        alert('Error: ' + getResult.error);
        return;
      }

      const edition = getResult.data;

      const response = await fetch(`/api/editions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...edition,
          is_featured: false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Edition removed from featured');
        fetchFeaturedEditions();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove edition');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Featured Edition Manager</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Featured editions will only appear on the homepage when their status is <strong>Published</strong>. 
            Draft or processing editions won't be visible to visitors even if marked as featured.
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : editions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No featured editions. Mark editions as featured to display them here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {editions.map((edition) => (
              <div
                key={edition.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                {edition.firstPageImage ? (
                  edition.firstPageImage.endsWith('.pdf') ? (
                    <PDFThumbnail
                      url={edition.firstPageImage}
                      alt={edition.title}
                      className="w-32 h-40 rounded shadow overflow-hidden"
                    />
                  ) : (
                    <img
                      src={edition.firstPageImage}
                      alt={edition.title}
                      className="w-32 h-40 object-cover rounded shadow"
                    />
                  )
                ) : (
                  <div className="w-32 h-40 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-sm text-gray-500">No Image</span>
                  </div>
                )}
                <button
                  onClick={() => removeFromFeatured(edition.id, edition.title)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Remove from Featured"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <div className="font-medium text-gray-500">
                    {edition.title}
                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      edition.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {edition.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(edition.date).toLocaleDateString()}
                  </div>
                  {edition.status !== 'published' && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ This edition won't appear on homepage until published
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
