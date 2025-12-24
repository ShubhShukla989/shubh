'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink } from 'lucide-react';
import { pageService } from '@/lib/services/pageService';
import { Page } from '@/lib/types';
import { cn } from '@/lib/utils';
import ActionIcons from '@/components/ActionIcons';

export default function PageManager() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await pageService.getPages();
      setPages(response.pages || []);
    } catch (error) {
      console.error('Failed to load pages:', error);
      setPages([]); // Ensure pages is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await pageService.getPages({
        search: searchQuery,
        status: statusFilter,
      });
      setPages(response.pages || []);
    } catch (error) {
      console.error('Search failed:', error);
      setPages([]); // Ensure pages is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    loadPages();
  };

  const handleDelete = async (id: number) => {
    try {
      await pageService.deletePage(id);
      setPages((pages || []).filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete page');
    }
  };

  const handleView = (alias: string) => {
    window.open(`/page/${alias}`, '_blank');
  };

  const filteredPages = (pages || []).filter((page) => {
    const matchesSearch = !searchQuery || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.alias.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-500">Page Manager</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage static pages and content
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/pages/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Public">Public</option>
              <option value="Draft">Draft</option>
              <option value="Private">Private</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading pages...
                    </div>
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No pages found. Create your first page to get started.
                  </td>
                </tr>
              ) : (
                filteredPages.map((page, index) => (
                  <tr
                    key={page.id}
                    className={cn(
                      'hover:bg-blue-50 transition-colors',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionIcons.Group>
                        <ActionIcons.View
                          onClick={() => handleView(page.alias)}
                          title="View page"
                        />
                        <ActionIcons.Edit
                          onClick={() => router.push(`/admin/pages/edit/${page.id}`)}
                          title="Edit page"
                        />
                        <ActionIcons.Delete
                          onClick={() => setDeleteConfirm(page.id)}
                          title="Delete page"
                        />
                      </ActionIcons.Group>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-500">{page.title}</div>
                      {page.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {page.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-blue-600">
                        {page.alias}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          page.status === 'Public' && 'bg-green-100 text-green-800',
                          page.status === 'Draft' && 'bg-amber-100 text-amber-800',
                          page.status === 'Private' && 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {page.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        {!loading && filteredPages.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                disabled
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-500 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the page "
              <strong>{(pages || []).find((p) => p.id === deleteConfirm)?.title}</strong>"? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
