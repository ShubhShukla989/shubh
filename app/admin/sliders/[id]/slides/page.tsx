'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { sliderService, SlideData } from '@/lib/services/sliderService';
import { Slider } from '@/lib/types';

/**
 * Slides Manager - Manage slides for a specific slideshow
 * Allows uploading, reordering, and deleting slides
 */
export default function SlidesManager() {
  const params = useParams();
  const router = useRouter();
  const sliderId = params?.id ? parseInt(params.id as string) : 0;

  const [slideshow, setSlideshow] = useState<Slider | null>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [imageAlt, setImageAlt] = useState('');

  useEffect(() => {
    fetchSlideshow();
  }, [sliderId]);

  /**
   * Fetch slideshow and its slides
   */
  const fetchSlideshow = async () => {
    try {
      setIsLoading(true);
      const data = await sliderService.getSlider(sliderId);
      setSlideshow(data);
      setSlides(data.slides || []);
    } catch (error) {
      console.error('Error fetching slideshow:', error);
      alert('Failed to load slideshow');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Upload new slide
   */
  const handleUploadSlide = async () => {
    if (!selectedFile) {
      alert('Please select an image');
      return;
    }

    try {
      setIsUploading(true);

      // Upload image to slider upload API
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/sliders/upload-slide', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { url } = await uploadResponse.json();

      // Add slide to slideshow
      const newSlide: SlideData = {
        imageUrl: url,
        alt: imageAlt || selectedFile.name,
        position: slides.length,
        visible: true,
      };

      await sliderService.addSlide(sliderId, newSlide);

      alert('Image added successfully!');
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setImageAlt('');
      setShowUploadModal(false);
      
      // Refresh slides
      await fetchSlideshow();
    } catch (error) {
      console.error('Error uploading slide:', error);
      alert('Failed to upload slide');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Delete slide
   */
  const handleDeleteSlide = async (slideId: number) => {
    if (!confirm('Are you sure you want to delete this slide?')) {
      return;
    }

    try {
      await sliderService.deleteSlide(sliderId, slideId);
      alert('Slide deleted successfully!');
      await fetchSlideshow();
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Failed to delete slide');
    }
  };

  /**
   * Move slide up
   */
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newSlides = [...slides];
    [newSlides[index], newSlides[index - 1]] = [newSlides[index - 1], newSlides[index]];
    
    // Update positions
    newSlides.forEach((slide, idx) => {
      slide.position = idx;
    });

    setSlides(newSlides);
    
    try {
      const order = newSlides.map(s => s.id!);
      await sliderService.reorderSlides(sliderId, order);
    } catch (error) {
      console.error('Error reordering slides:', error);
      alert('Failed to reorder slides');
      await fetchSlideshow(); // Revert on error
    }
  };

  /**
   * Move slide down
   */
  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;

    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    
    // Update positions
    newSlides.forEach((slide, idx) => {
      slide.position = idx;
    });

    setSlides(newSlides);
    
    try {
      const order = newSlides.map(s => s.id!);
      await sliderService.reorderSlides(sliderId, order);
    } catch (error) {
      console.error('Error reordering slides:', error);
      alert('Failed to reorder slides');
      await fetchSlideshow(); // Revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!slideshow) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Slideshow not found</h2>
          <button
            onClick={() => router.push('/admin/sliders')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Slideshows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Slides Manager - {slideshow.title}
          </h1>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-3">
          <button
            onClick={() => router.push('/admin/sliders')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
          >
            ◀ Back To Slideshows
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            New Slide
          </button>
        </div>

        {/* Slides Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slide Image</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slides.length > 0 ? (
                slides.map((slide, index) => (
                  <tr key={slide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteSlide(slide.id!)}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 w-8 h-8 flex items-center justify-center"
                          title="Delete"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed w-8 h-8 flex items-center justify-center"
                          title="Move Up"
                        >
                          🔺
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === slides.length - 1}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed w-8 h-8 flex items-center justify-center"
                          title="Move Down"
                        >
                          🔻
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={slide.imageUrl}
                        alt={slide.alt}
                        className="h-32 w-auto object-cover rounded shadow-sm"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                    No slides yet. Click "New Slide" to add your first image.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Upload New Slide</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepts: JPG, JPEG, PNG
                </p>
              </div>

              {previewUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 w-auto mx-auto rounded shadow-sm"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text (Optional)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setImageAlt('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSlide}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
