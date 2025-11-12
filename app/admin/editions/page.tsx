'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  FileText,
  Filter,
} from 'lucide-react';
import { Edition } from '@/lib/types';
import ActionIcons from '@/components/ActionIcons';

export default function EditionsPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [filterByUser, setFilterByUser] = useState('all');
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEdition, setEditingEdition] = useState<Edition | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [seoSubTab, setSeoSubTab] = useState('basic');
  const [scheduleDateTime, setScheduleDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [extractSettings, setExtractSettings] = useState({
    resolution: 150,
    jpgQuality: 80,
    useAlternateEngine: false,
    startPage: 1,
    endPage: 1,
    extractAll: true,
    currentPage: 1,
  });
  const [formData, setFormData] = useState<any>({
    title: '',
    alias: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categories: '',
    status: 'draft',
    pdfFile: null,
    seo_h1: '',
    seo_meta_description: '',
  });
  const [cols, setCols] = useState({
    title: true,
    date: true,
    categories: true,
    pdf: true,
    status: true,
  });

  useEffect(() => {
    fetchEditions();
    fetchCategories();
    autoPublishScheduledEditions();
  }, []);

  const autoPublishScheduledEditions = async () => {
    try {
      await fetch('/api/editions/auto-publish', { method: 'POST' });
    } catch (error) {
      console.error('Auto-publish check failed:', error);
    }
  };

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

  const fetchEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      const data = await response.json();
      if (data.success) {
        setEditions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (edition: Edition) => {
    setEditingEdition(edition);
    setFormData({
      title: edition.title || '',
      alias: edition.alias || '',
      description: edition.description || '',
      date: edition.date || new Date().toISOString().split('T')[0],
      status: edition.status || 'draft',
      categories: '',
      seo_h1: edition.seo_h1 || '',
      seo_meta_description: edition.seo_meta_description || '',
    });
    // Set schedule datetime if edition has one
    if (edition.scheduled_date) {
      const scheduledDate = new Date(edition.scheduled_date);
      setScheduleDateTime(scheduledDate.toISOString().slice(0, 16));
    } else {
      setScheduleDateTime(new Date().toISOString().slice(0, 16));
    }
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this edition?')) return;

    try {
      const response = await fetch(`/api/editions/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        alert('Edition deleted successfully');
        fetchEditions();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete edition:', error);
      alert('Failed to delete edition');
    }
  };

  const toggleFeatured = async (id: number, currentFeatured: boolean, title: string) => {
    const action = currentFeatured ? 'remove from homepage' : 'feature on homepage';
    
    if (!confirm(`Are you sure you want to ${action} "${title}"?`)) return;

    try {
      // First get the full edition data
      const getResponse = await fetch(`/api/editions/${id}`);
      const getResult = await getResponse.json();
      
      if (!getResult.success) {
        alert('Error: ' + getResult.error);
        return;
      }

      const edition = getResult.data;

      // Update with all fields
      const response = await fetch(`/api/editions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...edition,
          is_featured: !currentFeatured,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Edition ${currentFeatured ? 'removed from' : 'featured on'} homepage successfully`);
        fetchEditions();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      alert('Failed to toggle featured status');
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      {/* Breadcrumb Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <button className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded hover:bg-purple-200 transition-colors">All Editions »</button>
        <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100 transition-colors">Edit Edition »</button>
        <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100 transition-colors">Upload/Manage Pages »</button>
        <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100 transition-colors">Edit Area Maps »</button>
        <button className="px-4 py-2 text-gray-600 text-sm font-medium rounded hover:bg-gray-100 transition-colors">View</button>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        {/* Controls Row */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/epaper"
              target="_blank"
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Public E-Paper
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <ActionIcons.Add className="!p-0 !bg-transparent" /> New Edition
            </button>

            <select className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option>-- Bulk Actions --</option>
              <option>Publish</option>
              <option>Unpublish</option>
              <option>Delete</option>
            </select>
            <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">Apply</button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">--All/Any--</option>
              <option value="news">News</option>
              <option value="sports">Sports</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">--All/Any--</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Processing">Processing</option>
            </select>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="15">Perpage - 15</option>
              <option value="25">Perpage - 25</option>
              <option value="50">Perpage - 50</option>
            </select>
            <select
              value={filterByUser}
              onChange={(e) => setFilterByUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">--Filter By User--</option>
            </select>
            <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">Go</button>
            <button className="px-3 py-2 border border-gray-300 rounded text-sm">Reset</button>

            <div className="relative">
              <button
                onClick={() => setColumnsMenuOpen((v) => !v)}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" /> Show/Hide Columns <ChevronDown className="w-4 h-4" />
              </button>
              {columnsMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow p-2 z-10">
                  {[
                    { key: 'title', label: 'Title' },
                    { key: 'date', label: 'Date' },
                    { key: 'categories', label: 'Categories' },
                    { key: 'pdf', label: 'PDF' },
                    { key: 'status', label: 'Status' },
                  ].map((c) => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={(cols as any)[c.key]}
                        onChange={(e) => setCols((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
                {cols.title && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                )}
                {cols.date && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                )}
                {cols.categories && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categories</th>
                )}
                {cols.pdf && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PDF</th>
                )}
                {cols.status && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading editions...
                  </td>
                </tr>
              ) : editions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No editions found. Create your first edition!
                  </td>
                </tr>
              ) : (
                editions.map((edition, index) => (
                  <tr
                    key={edition.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <ActionIcons.Group>
                        <ActionIcons.Edit
                          onClick={() => handleEditClick(edition)}
                          title="Edit"
                        />
                        <Link href={`/admin/editions/${edition.id}/pages`}>
                          <ActionIcons.Upload title="Upload/Manage Pages" />
                        </Link>
                        <ActionIcons.Delete
                          onClick={() => handleDelete(edition.id)}
                          title="Delete"
                        />
                        {edition.is_featured ? (
                          <ActionIcons.Remove
                            onClick={() => toggleFeatured(edition.id, edition.is_featured || false, edition.title)}
                            title="Remove from Homepage"
                          />
                        ) : (
                          <ActionIcons.Add
                            onClick={() => toggleFeatured(edition.id, edition.is_featured || false, edition.title)}
                            title="Feature on Homepage"
                          />
                        )}
                        <Link href={`/epaper/view/${edition.id}`} target="_blank">
                          <ActionIcons.View title="View E-Paper" />
                        </Link>
                      </ActionIcons.Group>
                    </td>
                    {cols.title && (
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{edition.title}</td>
                    )}
                    {cols.date && (
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(edition.date).toLocaleDateString()}</td>
                    )}
                    {cols.categories && (
                      <td className="px-4 py-3 text-sm text-gray-600">{edition.category_id || 'Uncategorized'}</td>
                    )}
                    {cols.pdf && (
                      <td className="px-4 py-3">
                        {edition.pdf_url && (
                          <a
                            href={edition.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-700"
                          >
                            <FileText className="w-5 h-5" />
                          </a>
                        )}
                      </td>
                    )}
                    {cols.status && (
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(edition.status)}`}
                        >
                          {edition.status.toUpperCase()}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {editions.length} of {editions.length} editions
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Edition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">New</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'seo'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SEO
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Edition Title & Alias */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edition Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setFormData({
                            ...formData,
                            title,
                            alias: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alias
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.alias}
                          onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              alias: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                            });
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                          title="Generate from title"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Epaper Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Epaper Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO Section Header */}
                  <div className="bg-blue-500 text-white px-4 py-3 -mx-6 -mt-6 mb-6">
                    <h3 className="text-lg font-semibold">Search Engine Optimization</h3>
                  </div>

                  {/* SEO Sub-tabs */}
                  <div className="border-b border-gray-200 -mx-6 px-6">
                    <div className="flex gap-2">
                      {['Basic', 'Open Graph', 'Twitter', 'Header/Footer Codes', 'Variables'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSeoSubTab(tab.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-'))}
                          className={`px-4 py-2 text-sm font-medium ${
                            seoSubTab === tab.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Tab */}
                  {seoSubTab === 'basic' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Custom Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-500 italic mt-1">
                          This title will be used in &lt;title&gt; &lt;/title&gt; tag
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Meta Keywords
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Robots
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Open Graph Tab */}
                  {seoSubTab === 'open-graph' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Type
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                          <option>--Global--</option>
                          <option>article</option>
                          <option>website</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="border border-gray-200 rounded p-4 text-center mb-2">
                            <img src="/api/placeholder/150/150" alt="Preview" className="mx-auto" />
                          </div>
                          <button className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                            Upload OG:Image
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            OG Image Alt
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded p-4">
                        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          Add Custom OG Image Sizes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Twitter Tab */}
                  {seoSubTab === 'twitter' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Twitter Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Twitter Description
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="border border-gray-200 rounded p-4 text-center mb-2">
                        <img src="/api/placeholder/150/150" alt="Preview" className="mx-auto" />
                      </div>
                      <button className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Upload Twitter:Image
                      </button>
                    </div>
                  )}

                  {/* Header/Footer Codes Tab */}
                  {seoSubTab === 'header-footer-codes' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Code before closing Head Tag
                        </label>
                        <textarea
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Code before closing Body Tag
                        </label>
                        <textarea
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Variables Tab Content */}
                  {seoSubTab === 'variables' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Variables</h4>
                      <div className="border border-gray-200 rounded">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-200">
                            {[
                              { variable: '{edition_title}', description: 'Edition Title' },
                              { variable: '{edition_description}', description: 'Description' },
                              { variable: '{date}', description: 'Date' },
                              { variable: '{page_title}', description: 'Page Title' },
                              { variable: '{page_description}', description: 'Page Description' },
                              { variable: '{page_category_title}', description: 'Page Category Title' },
                              { variable: '{category_title}', description: 'Category Title' },
                            ].map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                  {item.variable}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
              >
                ⏰ Schedule
              </button>
              <button
                onClick={async () => {
                  if (!formData.title) {
                    alert('Please enter a title');
                    return;
                  }
                  try {
                    const response = await fetch('/api/editions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: formData.title,
                        alias: formData.alias,
                        date: formData.date,
                        description: formData.description,
                        category_id: formData.category_id || null,
                        seo_h1: formData.seo_h1,
                        seo_meta_description: formData.seo_meta_description,
                        status: 'draft',
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert('Edition saved privately!');
                      setShowCreateModal(false);
                      setFormData({
                        title: '',
                        alias: '',
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        category_id: '',
                        status: 'draft',
                        pdfFile: null,
                        seo_h1: '',
                        seo_meta_description: '',
                      });
                      fetchEditions();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error saving edition:', error);
                    alert('Failed to save edition');
                  }
                }}
                className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 flex items-center gap-2"
              >
                🔒 Save Privately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Edition Modal */}
      {showEditModal && editingEdition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEdition(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'seo'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SEO
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edition Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alias
                      </label>
                      <input
                        type="text"
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Epaper Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categories
                      </label>
                      <input
                        type="text"
                        value={formData.categories}
                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="Select Categories"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Date & Time
                      <span className="text-xs text-gray-500 ml-2">(Optional - for scheduled publishing)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set a future date/time to automatically publish this edition
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO Section Header */}
                  <div className="bg-blue-500 text-white px-4 py-3 -mx-6 -mt-6 mb-6">
                    <h3 className="text-lg font-semibold">Search Engine Optimization</h3>
                  </div>

                  {/* SEO Sub-tabs */}
                  <div className="border-b border-gray-200 -mx-6 px-6">
                    <div className="flex gap-2">
                      {['Basic', 'Open Graph', 'Twitter', 'Header/Footer Codes', 'Variables'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSeoSubTab(tab.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-'))}
                          className={`px-4 py-2 text-sm font-medium ${
                            seoSubTab === tab.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Tab */}
                  {seoSubTab === 'basic' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Custom Title
                        </label>
                        <input
                          type="text"
                          value={formData.seo_h1}
                          onChange={(e) => setFormData({ ...formData, seo_h1: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-500 italic mt-1">
                          This title will be used in &lt;title&gt; &lt;/title&gt; tag
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={formData.seo_meta_description}
                          onChange={(e) => setFormData({ ...formData, seo_meta_description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Meta Keywords
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Robots
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Open Graph Tab */}
                  {seoSubTab === 'open-graph' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Description
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          OG Type
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                          <option>--Global--</option>
                          <option>article</option>
                          <option>website</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="border border-gray-200 rounded p-4 text-center mb-2">
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                              Preview
                            </div>
                          </div>
                          <button className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                            Upload OG:Image
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            OG Image Alt
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Twitter Tab */}
                  {seoSubTab === 'twitter' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Twitter Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Twitter Description
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="border border-gray-200 rounded p-4 text-center mb-2">
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                          Preview
                        </div>
                      </div>
                      <button className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Upload Twitter:Image
                      </button>
                    </div>
                  )}

                  {/* Header/Footer Codes Tab */}
                  {seoSubTab === 'header-footer-codes' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Code before closing Head Tag
                        </label>
                        <textarea
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Code before closing Body Tag
                        </label>
                        <textarea
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Variables Tab */}
                  {seoSubTab === 'variables' && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Variables</h4>
                      <div className="border border-gray-200 rounded">
                        <table className="w-full">
                          <tbody className="divide-y divide-gray-200">
                            {[
                              { variable: '{edition_title}', description: 'Edition Title' },
                              { variable: '{edition_description}', description: 'Description' },
                              { variable: '{date}', description: 'Date' },
                              { variable: '{page_title}', description: 'Page Title' },
                              { variable: '{page_description}', description: 'Page Description' },
                              { variable: '{page_category_title}', description: 'Page Category Title' },
                              { variable: '{category_title}', description: 'Category Title' },
                            ].map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                  {item.variable}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={async () => {
                  if (!scheduleDateTime) {
                    alert('Please select a schedule date and time');
                    return;
                  }
                  try {
                    const response = await fetch(`/api/editions/${editingEdition.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: formData.title,
                        alias: formData.alias,
                        date: formData.date,
                        description: formData.description,
                        category_id: formData.category_id || null,
                        seo_h1: formData.seo_h1,
                        seo_meta_description: formData.seo_meta_description,
                        status: 'scheduled',
                        scheduled_date: new Date(scheduleDateTime).toISOString(),
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`Edition rescheduled for ${new Date(scheduleDateTime).toLocaleString()}!`);
                      setShowEditModal(false);
                      setEditingEdition(null);
                      fetchEditions();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error rescheduling edition:', error);
                    alert('Failed to reschedule edition');
                  }
                }}
                className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                🕐 Reschedule
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/editions/${editingEdition.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: formData.title,
                        alias: formData.alias,
                        date: formData.date,
                        description: formData.description,
                        category_id: formData.category_id || null,
                        seo_h1: formData.seo_h1,
                        seo_meta_description: formData.seo_meta_description,
                        status: 'draft',
                        scheduled_date: null,
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert('Edition saved privately!');
                      setShowEditModal(false);
                      setEditingEdition(null);
                      fetchEditions();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error saving edition:', error);
                    alert('Failed to save edition');
                  }
                }}
                className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
              >
                💾 Save Privately
              </button>
              <button
                onClick={async () => {
                  try {
                    // Determine status based on schedule datetime
                    let status = 'published';
                    let scheduled_date = null;
                    
                    if (scheduleDateTime) {
                      const scheduleTime = new Date(scheduleDateTime);
                      const now = new Date();
                      
                      if (scheduleTime > now) {
                        // Future date - set as scheduled
                        status = 'scheduled';
                        scheduled_date = scheduleTime.toISOString();
                      }
                    }

                    const response = await fetch(`/api/editions/${editingEdition.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: formData.title,
                        alias: formData.alias,
                        date: formData.date,
                        description: formData.description,
                        category_id: formData.category_id || null,
                        seo_h1: formData.seo_h1,
                        seo_meta_description: formData.seo_meta_description,
                        status,
                        scheduled_date,
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      if (status === 'scheduled') {
                        alert(`Edition scheduled for ${new Date(scheduleDateTime).toLocaleString()}!`);
                      } else {
                        alert('Edition updated successfully!');
                      }
                      setShowEditModal(false);
                      setEditingEdition(null);
                      fetchEditions();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error updating edition:', error);
                    alert('Failed to update edition');
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📝 Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center border border-gray-300 rounded"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Schedule On
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={async () => {
                  if (!formData.title) {
                    alert('Please enter a title');
                    return;
                  }
                  if (!scheduleDateTime) {
                    alert('Please select a date and time');
                    return;
                  }
                  try {
                    const response = await fetch('/api/editions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: formData.title,
                        alias: formData.alias,
                        date: formData.date,
                        description: formData.description,
                        category_id: formData.category_id || null,
                        seo_h1: formData.seo_h1,
                        seo_meta_description: formData.seo_meta_description,
                        status: 'scheduled',
                        scheduled_date: new Date(scheduleDateTime).toISOString(),
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`Edition scheduled for ${new Date(scheduleDateTime).toLocaleString()}!`);
                      setShowScheduleModal(false);
                      setShowCreateModal(false);
                      setFormData({
                        title: '',
                        alias: '',
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        category_id: '',
                        status: 'draft',
                        pdfFile: null,
                        seo_h1: '',
                        seo_meta_description: '',
                      });
                      setScheduleDateTime(new Date().toISOString().slice(0, 16));
                      fetchEditions();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error scheduling edition:', error);
                    alert('Failed to schedule edition');
                  }
                }}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center justify-center gap-2 text-lg font-medium"
              >
                <span>⏰</span> Schedule Now
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-6 py-3 bg-gray-400 text-white rounded hover:bg-gray-500 text-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Manage Pages Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-600 text-white">
              <h3 className="text-xl font-bold">dobajedopahar - Pages</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 text-sm">
              <button className="text-blue-600 hover:underline">All Editions »</button>
              <button className="text-blue-600 hover:underline">Edit Edition »</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded">Upload/Manage Pages »</button>
              <button className="text-blue-600 hover:underline">Edit Area Maps »</button>
              <button className="text-blue-600 hover:underline">View</button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-2">
                  <ActionIcons.Upload className="!p-0 !bg-transparent" /> Upload JPGs...
                </button>
                <label className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-2 cursor-pointer">
                  <ActionIcons.Upload className="!p-0 !bg-transparent" /> Upload PDF...
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedPDF(file);
                      }
                    }}
                  />
                </label>
                <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Download PDF
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete PDF
                </button>
                <button
                  onClick={() => {
                    if (uploadedPDF) {
                      setShowUploadModal(false);
                      setShowExtractModal(true);
                    } else {
                      alert('Please upload a PDF first');
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2"
                >
                  🔄 Extract Pages
                </button>
              </div>

              {/* PDF Status */}
              {uploadedPDF && (
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                  <p className="text-green-700">
                    ✓ PDF uploaded: <strong>{uploadedPDF.name}</strong>
                  </p>
                </div>
              )}

              {/* Bulk Actions */}
              <div className="flex items-center gap-2 mb-4">
                <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                  <option>-- Bulk Actions --</option>
                  <option>Delete Selected</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                  Apply
                </button>
              </div>

              {/* Pages List/Grid */}
              <div className="border border-gray-200 rounded p-8 text-center text-gray-500">
                {uploadedPDF ? (
                  <div>
                    <p className="mb-4">PDF uploaded successfully!</p>
                    <p>Click "Extract Pages" to extract pages from the PDF.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <ActionIcons.Upload className="!w-8 !h-8" />
                      </div>
                    </div>
                    <p>No pages yet. Upload a PDF or JPG files to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extract Pages from PDF Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Extract Pages from PDF</h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center border border-gray-300 rounded"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Settings */}
                <div className="space-y-6">
                  {/* Resolution & JPG Quality */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Resolution
                      </label>
                      <select
                        value={extractSettings.resolution}
                        onChange={(e) => setExtractSettings({ ...extractSettings, resolution: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="72">72</option>
                        <option value="150">150</option>
                        <option value="300">300</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        JPG Quality
                      </label>
                      <input
                        type="number"
                        value={extractSettings.jpgQuality}
                        onChange={(e) => setExtractSettings({ ...extractSettings, jpgQuality: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    Preview
                  </button>

                  {/* Alternate Engine Checkbox */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extractSettings.useAlternateEngine}
                      onChange={(e) => setExtractSettings({ ...extractSettings, useAlternateEngine: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Use Alternate Engine for PDF to JPG Conversion</span>
                  </label>

                  {/* Start & End Page */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Start Page
                      </label>
                      <input
                        type="number"
                        value={extractSettings.startPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, startPage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        End Page
                      </label>
                      <input
                        type="number"
                        value={extractSettings.endPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, endPage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Extract All Pages Checkbox */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extractSettings.extractAll}
                      onChange={(e) => setExtractSettings({ ...extractSettings, extractAll: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-900">Extract All Pages (Maximum 30 Pages)</span>
                  </label>

                  {/* Extract Button */}
                  <button className="w-full px-4 py-3 bg-pink-500 text-white rounded hover:bg-pink-600 font-medium">
                    Extract
                  </button>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Page:</span>
                    <input
                      type="number"
                      value={extractSettings.currentPage}
                      onChange={(e) => setExtractSettings({ ...extractSettings, currentPage: Number(e.target.value) })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                  </div>

                  {/* PDF Preview */}
                  <div className="border-2 border-gray-300 rounded p-4 bg-gray-50 min-h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-white border border-gray-200 rounded shadow-lg p-4 max-w-md">
                        <img
                          src="/api/placeholder/400/600"
                          alt="PDF Preview"
                          className="w-full h-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-4">Page {extractSettings.currentPage} Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
