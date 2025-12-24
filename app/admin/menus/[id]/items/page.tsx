'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface MenuItem {
  id: number;
  menu_id: number;
  title: string;
  type: 'external' | 'page' | 'epaper_category' | 'epaper_archive';
  url?: string;
  page_id?: number;
  category_id?: number;
  position: number;
  parent_id?: number | null;
}

interface Menu {
  id: number;
  name: string;
}

interface Page {
  id: number;
  title: string;
  alias: string;
}

export default function MenuItemsManager() {
  const params = useParams();
  const router = useRouter();
  const menuId = params?.id as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('external');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'external',
    url: '',
    page_id: '',
    category_id: '',
    parent_id: '',
    target: '_self',
  });

  useEffect(() => {
    if (menuId) {
      fetchMenu();
      fetchMenuItems();
      fetchPages();
    }
  }, [menuId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/menu/${menuId}`);
      if (response.ok) {
        const data = await response.json();
        setMenu(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/menu/${menuId}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      // Fetch static pages from sidebar Pages section
      const response = await fetch('/api/pages');
      if (response.ok) {
        const data = await response.json();
        const staticPages = Array.isArray(data) ? data : data.data || [];
        setPages(staticPages);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setPages([]);
    }
  };

  const openCreateModal = (type: string) => {
    setSelectedType(type);
    setFormData({
      title: '',
      type,
      url: '',
      page_id: '',
      category_id: '',
      parent_id: '',
      target: type === 'external' ? '_blank' : '_self',
    });
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
        position: items.length,
      };

      if (formData.parent_id) {
        payload.parent_id = parseInt(formData.parent_id);
      }

      // Add type-specific fields
      if (formData.type === 'external') {
        if (!formData.url.trim()) {
          alert('Please enter a URL');
          return;
        }
        payload.url = formData.url;
      } else if (formData.type === 'page') {
        if (!formData.page_id) {
          alert('Please select a page');
          return;
        }
        payload.page_id = parseInt(formData.page_id);
      } else if (formData.type === 'epaper_category') {
        if (!formData.category_id) {
          alert('Please select a category');
          return;
        }
        payload.category_id = parseInt(formData.category_id);
      }

      const response = await fetch(`/api/menu/${menuId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          type: 'external',
          url: '',
          page_id: '',
          category_id: '',
          parent_id: '',
          target: '_self',
        });
        fetchMenuItems();
      } else {
        const errorData = await response.json();
        alert(`Failed to create menu item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      alert('Failed to create menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      url: item.url || '',
      page_id: item.page_id?.toString() || '',
      category_id: item.category_id?.toString() || '',
      parent_id: item.parent_id?.toString() || '',
      target: '_self',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
      };

      if (formData.type === 'external') {
        payload.url = formData.url;
      } else if (formData.type === 'page') {
        payload.page_id = parseInt(formData.page_id);
      } else if (formData.type === 'epaper_category') {
        payload.category_id = parseInt(formData.category_id);
      }

      const response = await fetch(`/api/menu/${menuId}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingItem(null);
        fetchMenuItems();
      } else {
        alert('Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Failed to update menu item');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/menu/${menuId}/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMenuItems();
      } else {
        alert('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/menus"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-500">
            Menuitems Manager - {menu?.name || 'Loading...'}
          </h1>
        </div>

      </div>

      {/* Create Menu Item Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ◀
          </button>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="external">External Link</option>
            <option value="page">Page</option>
            <option value="epaper_category">Epaper: Category</option>
            <option value="epaper_archive">Epaper: Archive</option>
          </select>
          <button
            onClick={() => openCreateModal(selectedType)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No menu items yet. Create your first item above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-500">{item.title}</div>
                  <div className="text-sm text-gray-500">
                    Type: {item.type} {item.url && `• URL: ${item.url}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Menuitem</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Google"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.type === 'external' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://wwww"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.type === 'page' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Page
                  </label>
                  <select
                    value={formData.page_id}
                    onChange={(e) =>
                      setFormData({ ...formData, page_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a page</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'epaper_category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Category ID
                  </label>
                  <input
                    type="number"
                    placeholder="Enter category ID"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Parent
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">(None)</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Target
                </label>
                <select
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Window</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Menu Item</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="external">External Link</option>
                <option value="page">Page</option>
                <option value="epaper_category">Epaper: Category Archive</option>
                <option value="epaper_archive">Epaper: Month/Year Archive</option>
              </select>

              {formData.type === 'external' && (
                <input
                  type="url"
                  placeholder="URL"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
