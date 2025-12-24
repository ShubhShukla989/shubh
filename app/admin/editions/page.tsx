'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  FileText,
  Filter,
} from 'lucide-react';
import { Edition, User } from '@/lib/types';
import ActionIcons from '@/components/ActionIcons';
import { useAuth } from '@/contexts/AuthContext';
import EditionModal from '@/components/admin/EditionModal';

export default function EditionsPage() {
  const { hasPermission, isSuperAdmin, loading: authLoading } = useAuth();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [perPage, setPerPage] = useState(15);
  const [filterByUser, setFilterByUser] = useState('all');
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  
  // Column visibility state with localStorage persistence
  const [cols, setCols] = useState({
    title: true,
    date: true,
    categories: true,
    pdf: true,
    createdOn: true,
    updatedOn: true,
    publishedOn: true,
    createdBy: true,
    updatedBy: true,
    ownedBy: true,
    status: true,
  });

  const [isClient, setIsClient] = useState(false);
  
  // Bulk actions state
  const [selectedEditions, setSelectedEditions] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Modal state
  const [showNewEditionModal, setShowNewEditionModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load column visibility from localStorage after component mounts
    const saved = localStorage.getItem('editions-columns-visibility');
    if (saved) {
      try {
        setCols(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading column visibility:', error);
      }
    }
    
    fetchEditions();
    fetchCategories();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchEditions = async () => {
    try {
      let url = '/api/editions?';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter.toLowerCase());
      }
      if (categoryFilter !== 'all') {
        params.append('category_id', categoryFilter);
      }
      if (filterByUser !== 'all') {
        params.append('created_by', filterByUser);
      }
      
      url += params.toString();
      
      const response = await fetch(url);
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
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const handleBulkAction = async () => {
    if (selectedEditions.length === 0) {
      alert('Please select at least one edition');
      return;
    }

    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    const actionText = bulkAction === 'delete' 
      ? `delete ${selectedEditions.length} edition(s)` 
      : `${bulkAction} ${selectedEditions.length} edition(s)`;

    if (!confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const editionId of selectedEditions) {
        try {
          if (bulkAction === 'delete') {
            const response = await fetch(`/api/editions/${editionId}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            const getResponse = await fetch(`/api/editions/${editionId}`);
            const getResult = await getResponse.json();
            
            if (!getResult.success) {
              errorCount++;
              continue;
            }

            const edition = getResult.data;
            const newStatus = bulkAction === 'publish' ? 'published' : 'draft';

            const response = await fetch(`/api/editions/${editionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...edition,
                status: newStatus,
                scheduled_date: null,
              }),
            });

            const result = await response.json();
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully ${bulkAction === 'delete' ? 'deleted' : 'updated'} ${successCount} edition(s)!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
        setSelectedEditions([]);
        setBulkAction('');
        fetchEditions();
      } else {
        alert(`Failed to ${bulkAction} any editions.`);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(`Failed to perform bulk action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGoFilter = () => {
    fetchEditions();
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setFilterByUser('all');
    setPerPage(15);
    // Refetch with reset filters
    setTimeout(() => {
      fetchEditions();
    }, 100);
  };

  // Filter editions based on search term
  const filteredEditions = editions.filter(edition =>
    edition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    edition.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate editions
  const paginatedEditions = filteredEditions.slice(0, perPage);

  // Save column visibility to localStorage
  const updateColumnVisibility = (columnKey: string, visible: boolean) => {
    const newCols = { ...cols, [columnKey]: visible };
    setCols(newCols);
    if (isClient) {
      localStorage.setItem('editions-columns-visibility', JSON.stringify(newCols));
    }
  };

  return (
    <div>
      {/* Breadcrumb Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <button className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200 transition-colors">All Editions »</button>
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
            {!authLoading && (isSuperAdmin() || hasPermission('create_editions')) && (
              <button
                onClick={() => setShowNewEditionModal(true)}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <ActionIcons.Add className="!p-0 !bg-transparent !text-white" /> New Edition
              </button>
            )}

            {!authLoading && (isSuperAdmin() || hasPermission('delete_editions')) && (
              <>
                <select 
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">-- Bulk Actions --</option>
                  <option value="publish">Publish</option>
                  <option value="unpublish">Unpublish</option>
                  <option value="delete">Delete</option>
                </select>
                <button 
                  onClick={handleBulkAction}
                  disabled={selectedEditions.length === 0 || !bulkAction}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Apply
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">--All Categories--</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="all">--All/Any--</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="scheduled">Scheduled</option>
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
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullname}
                </option>
              ))}
            </select>
            
            <button 
              onClick={handleGoFilter}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Go
            </button>
            
            <button 
              onClick={handleResetFilter}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Reset
            </button>

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
                    { key: 'createdOn', label: 'Created On' },
                    { key: 'updatedOn', label: 'Updated On' },
                    { key: 'publishedOn', label: 'Published On' },
                    { key: 'createdBy', label: 'Created By' },
                    { key: 'updatedBy', label: 'Updated By' },
                    { key: 'ownedBy', label: 'Owned By' },
                    { key: 'status', label: 'Status' },
                  ].map((c) => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={(cols as any)[c.key]}
                        onChange={(e) => updateColumnVisibility(c.key, e.target.checked)}
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
        <div className="overflow-x-auto admin-table-container">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-2 lg:px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedEditions.length === paginatedEditions.length && paginatedEditions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEditions(paginatedEditions.map(ed => ed.id));
                      } else {
                        setSelectedEditions([]);
                      }
                    }}
                  />
                </th>
                <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[140px]">
                  Actions
                </th>
                {cols.title && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[200px]">Title</th>
                )}
                {cols.date && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[100px]">Date</th>
                )}
                {cols.categories && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Categories</th>
                )}
                {cols.pdf && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[60px]">PDF</th>
                )}
                {cols.createdOn && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Created On</th>
                )}
                {cols.updatedOn && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Updated On</th>
                )}
                {cols.publishedOn && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Published On</th>
                )}
                {cols.createdBy && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Created By</th>
                )}
                {cols.updatedBy && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Updated By</th>
                )}
                {cols.ownedBy && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[120px]">Owned By</th>
                )}
                {cols.status && (
                  <th className="px-2 lg:px-4 py-3 text-left text-sm font-semibold text-gray-500 min-w-[100px]">Status</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    Loading editions...
                  </td>
                </tr>
              ) : paginatedEditions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    No editions found. Create your first edition!
                  </td>
                </tr>
              ) : (
                paginatedEditions.map((edition, index) => (
                  <tr
                    key={edition.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2 lg:px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedEditions.includes(edition.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEditions([...selectedEditions, edition.id]);
                          } else {
                            setSelectedEditions(selectedEditions.filter(id => id !== edition.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 lg:px-4 py-3">
                      <ActionIcons.Group className="flex-wrap gap-1">
                        {!authLoading && (isSuperAdmin() || hasPermission('edit_editions')) && (
                          <Link href={`/admin/editions/${edition.id}/edit`}>
                            <ActionIcons.Edit
                              title="Edit"
                              className="p-1.5 lg:p-2"
                            />
                          </Link>
                        )}
                        <Link href={`/admin/editions/${edition.id}/pages`}>
                          <ActionIcons.Upload title="Upload/Manage Pages" className="p-1.5 lg:p-2" />
                        </Link>
                        {!authLoading && (isSuperAdmin() || hasPermission('delete_editions')) && (
                          <ActionIcons.Delete
                            onClick={() => handleDelete(edition.id)}
                            title="Delete"
                            className="p-1.5 lg:p-2"
                          />
                        )}
                        {edition.is_featured ? (
                          <ActionIcons.Remove
                            onClick={() => toggleFeatured(edition.id, edition.is_featured || false, edition.title)}
                            title="Remove from Homepage"
                            className="p-1.5 lg:p-2"
                          />
                        ) : (
                          <ActionIcons.Add
                            onClick={() => toggleFeatured(edition.id, edition.is_featured || false, edition.title)}
                            title="Feature on Homepage"
                            className="p-1.5 lg:p-2"
                          />
                        )}
                        <Link href={`/epaper/view/${edition.id}`} target="_blank">
                          <ActionIcons.View title="View E-Paper" className="p-1.5 lg:p-2" />
                        </Link>
                      </ActionIcons.Group>
                    </td>
                    {cols.title && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-500 font-medium">
                        <div className="min-w-0">
                          <div className="truncate">{edition.title}</div>
                          {edition.is_featured && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {cols.date && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(edition.date).toLocaleDateString()}
                      </td>
                    )}
                    {cols.categories && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600">
                        <div className="truncate">
                          {categories.find(c => c.id === edition.category_id)?.title || 'Uncategorized'}
                        </div>
                      </td>
                    )}
                    {cols.pdf && (
                      <td className="px-2 lg:px-4 py-3 text-center">
                        {edition.pdf_url && (
                          <a
                            href={edition.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="View PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    )}
                    {cols.createdOn && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(edition.created_at).toLocaleDateString()}
                      </td>
                    )}
                    {cols.updatedOn && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(edition.updated_at).toLocaleDateString()}
                      </td>
                    )}
                    {cols.publishedOn && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {edition.status === 'published' ? new Date(edition.updated_at).toLocaleDateString() : '-'}
                      </td>
                    )}
                    {cols.createdBy && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600">
                        <div className="truncate">
                          {edition.created_by_name || 'Unknown'}
                        </div>
                      </td>
                    )}
                    {cols.updatedBy && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600">
                        <div className="truncate">
                          {edition.updated_by_name || edition.created_by_name || 'Unknown'}
                        </div>
                      </td>
                    )}
                    {cols.ownedBy && (
                      <td className="px-2 lg:px-4 py-3 text-sm text-gray-600">
                        <div className="truncate">
                          {edition.created_by_name || 'Unknown'}
                        </div>
                      </td>
                    )}
                    {cols.status && (
                      <td className="px-2 lg:px-4 py-3">
                        <span
                          className={`inline-block px-2 lg:px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(edition.status)}`}
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
            Showing {paginatedEditions.length} of {filteredEditions.length} editions
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* New Edition Modal */}
      <EditionModal
        isOpen={showNewEditionModal}
        onClose={() => setShowNewEditionModal(false)}
        onSave={() => {
          fetchEditions(); // Refresh the list after saving
        }}
      />
    </div>
  );
}