'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Menu {
  id: number;
  name: string;
  location?: string;
  created_at: string;
}

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenus(data);
    } catch (error) {
      // Error handled by UI
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    if (!newMenuName.trim()) {
      alert('Please enter a menu name');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMenuName }),
      });

      if (response.ok) {
        setNewMenuName('');
        setShowCreateModal(false);
        fetchMenus();
      } else {
        alert('Failed to create menu');
      }
    } catch (error) {
      alert('Failed to create menu');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMenu = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMenus();
      } else {
        alert('Failed to delete menu');
      }
    } catch (error) {
      alert('Failed to delete menu');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-500">Menu Manager</h1>

      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Menu
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
                  Menu Name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No menus found. Create your first menu to get started.
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/menus/${menu.id}/items`}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Edit Menu Items"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteMenu(menu.id, menu.name)}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{menu.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Menu Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Menu</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Menu Name
              </label>
              <input
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Menu, Footer Menu"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateMenu}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewMenuName('');
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
