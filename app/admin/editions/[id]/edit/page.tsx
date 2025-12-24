'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditEditionPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edition, setEdition] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    alias: '',
    date: '',
    description: '',
    category_id: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchEdition();
    fetchCategories();
  }, [editionId]);

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

  const fetchEdition = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const result = await response.json();
      if (result.success) {
        setEdition(result.data);
        setFormData({
          title: result.data.title || '',
          alias: result.data.alias || '',
          date: result.data.date || '',
          description: result.data.description || '',
          category_id: result.data.category_id || '',
          status: result.data.status || 'draft',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch edition:', error);
      setLoading(false);
    }
  };

  const getSaveButtonText = () => {
    switch (formData.status) {
      case 'published':
        return 'Publish Now';
      case 'scheduled':
        return 'Schedule';
      case 'draft':
      default:
        return 'Save Privately';
    }
  };

  const handleSaveAction = async () => {
    if (formData.status === 'scheduled') {
      if (!scheduleDateTime) {
        alert('Please select a date and time for scheduling');
        return;
      }
      await handleScheduleSave();
    } else {
      await handleSave(formData.status);
    }
  };

  const handleScheduleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/editions/${editionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'scheduled',
          scheduled_date: new Date(scheduleDateTime).toISOString(),
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Edition scheduled successfully!');
        router.push('/admin/editions');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Failed to schedule edition');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (status: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/editions/${editionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: status,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        const statusText = status === 'published' ? 'published' : 'saved as draft';
        alert(`Edition ${statusText} successfully!`);
        router.push('/admin/editions');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save edition');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this edition?')) return;
    
    try {
      const response = await fetch(`/api/editions/${editionId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Edition deleted successfully!');
        router.push('/admin/editions');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete edition');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!edition) {
    return <div className="p-6">Edition not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Edit Edition</h1>
        <p className="text-gray-600 mt-1">Update edition details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Edition Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter edition title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Alias (URL Slug)
                  </label>
                  <input
                    type="text"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="edition-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Epaper Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Categories
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Save Privately</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Schedule</option>
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Schedule Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSaveAction}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : getSaveButtonText()}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <Link
                  href="/admin/editions"
                  className="w-full px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
