'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sliderService } from '@/lib/services/sliderService';
import { Slider } from '@/lib/types';
import ActionIcons from '@/components/ActionIcons';
import { Image } from 'lucide-react';

/**
 * Slideshows Manager - Main page for managing all slideshows
 * Displays list of slideshows with actions to edit, delete, or manage slides
 */
export default function SlideshowsManager() {
  const [slideshows, setSlideshows] = useState<Slider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlideshowName, setNewSlideshowName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const router = useRouter();

  // Fetch all slideshows on component mount
  useEffect(() => {
    fetchSlideshows();
  }, []);

  /**
   * Fetch all slideshows from API
   */
  const fetchSlideshows = async () => {
    try {
      setIsLoading(true);
      const response = await sliderService.getSliders();
      setSlideshows(response.sliders || []);
      setShowSetupBanner(false);
    } catch (error: any) {
      console.error('Error fetching slideshows:', error);
      // Show setup banner if tables don't exist
      if (error?.message && error.message.includes('does not exist')) {
        setShowSetupBanner(true);
      } else {
        alert('Failed to load slideshows. Check console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create new slideshow
   */
  const handleCreateSlideshow = async () => {
    if (!newSlideshowName.trim()) {
      alert('Please enter a slideshow name');
      return;
    }

    try {
      setIsCreating(true);
      const alias = sliderService.generateSlug(newSlideshowName);
      
      await sliderService.createSlider({
        title: newSlideshowName,
        alias,
        status: 'Active',
        config: sliderService.getDefaultConfig(),
      });

      // Show success message
      alert('Slideshow created successfully!');
      
      // Reset form and close modal
      setNewSlideshowName('');
      setShowCreateModal(false);
      
      // Refresh list
      await fetchSlideshows();
    } catch (error: any) {
      console.error('Error creating slideshow:', error);
      const errorMessage = error?.message || 'Failed to create slideshow';
      const hint = error?.hint || 'Make sure database tables are set up. See SLIDER_SETUP_NOW.md';
      alert(`${errorMessage}\n\n${hint}`);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Delete slideshow with confirmation
   */
  const handleDeleteSlideshow = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await sliderService.deleteSlider(id);
      alert('Slideshow deleted successfully!');
      await fetchSlideshows();
    } catch (error) {
      console.error('Error deleting slideshow:', error);
      alert('Failed to delete slideshow');
    }
  };

  /**
   * Navigate to slides manager
   */
  const handleManageSlides = (id: number) => {
    router.push(`/admin/sliders/${id}/slides`);
  };

  /**
   * Navigate to edit slideshow
   */
  const handleEditSlideshow = (id: number) => {
    router.push(`/admin/sliders/${id}/edit`);
  };

  // Filter slideshows based on search term
  const filteredSlideshows = slideshows.filter(slideshow =>
    slideshow.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-600">Slideshows Manager</h1>
        </div>

        {/* Setup Banner */}
        {showSetupBanner && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Database Setup Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The slider tables haven't been created yet. Please run the database migration:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Open your Supabase Dashboard → SQL Editor</li>
                    <li>Copy the SQL from: <code className="bg-yellow-100 px-1 rounded">supabase/migrations/create_sliders_tables.sql</code></li>
                    <li>Run the query</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="mt-2">
                    <strong>Quick guide:</strong> See <code className="bg-yellow-100 px-1 rounded">SLIDER_SETUP_NOW.md</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            New Slideshow
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-gray-200 text-gray-500 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Slideshows Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Actions</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Slideshow Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSlideshows.length > 0 ? (
                filteredSlideshows.map((slideshow) => (
                  <tr key={slideshow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <ActionIcons.Group>
                        <button
                          onClick={() => handleManageSlides(slideshow.id)}
                          className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                          title="Manage Slides"
                        >
                          <Image className="w-5 h-5" />
                        </button>
                        <ActionIcons.Edit
                          onClick={() => handleEditSlideshow(slideshow.id)}
                          title="Edit Slideshow"
                        />
                        <ActionIcons.Delete
                          onClick={() => handleDeleteSlideshow(slideshow.id, slideshow.title)}
                          title="Delete Slideshow"
                        />
                      </ActionIcons.Group>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-500">{slideshow.title}</div>
                      <div className="text-sm text-gray-500">
                        {slideshow.slides?.length || 0} slides
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No slideshows found matching your search' : 'No slideshows yet. Create your first one!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Slideshow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Slideshow</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Slideshow Name
                </label>
                <input
                  type="text"
                  value={newSlideshowName}
                  onChange={(e) => setNewSlideshowName(e.target.value)}
                  placeholder="Enter slideshow name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateSlideshow();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSlideshowName('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-500 rounded hover:bg-gray-300"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSlideshow}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
