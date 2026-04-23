'use client';

import { useState, useEffect } from 'react';
import ActionIcons from '@/components/ActionIcons';
import { Plus } from 'lucide-react';

interface User {
  id: number;
  fullname: string;
  email: string;
  mobile: string;
  role: string;
  regt_date: string;
  status: string;
}

export default function UsersManagerPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('09 Sep 2001');
  const [toDate, setToDate] = useState('12 Nov 2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    mobile: '',
    role: 'Admin'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.length === 0) {
      alert('Please select users and an action');
      return;
    }
    alert(`Applying "${bulkAction}" to ${selectedUsers.length} user(s)`);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('User deleted successfully!');
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to delete user: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error deleting user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('User created successfully!');
        setShowModal(false);
        setFormData({
          fullname: '',
          email: '',
          password: '',
          mobile: '',
          role: 'Admin'
        });
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to create user: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error creating user');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleBanUser = async (status: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          status: status
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to update user: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error updating user');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Users Manager</h1>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex gap-3">
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New User
        </button>
        <a
          href="/admin/users/permissions"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Manage Admin Permissions
        </a>
      </div>

      {/* Filters Row */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">--All/Any--</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">--All/Any--</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          <input
            type="text"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="From Date"
          />

          <input
            type="text"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="To Date"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go
          </button>

          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Reset
          </button>

          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Export
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Bulk Actions --</option>
            <option value="delete">Delete Selected</option>
            <option value="Active">Change Status To Active</option>
            <option value="Inactive">Change Status To Inactive</option>
            <option value="Suspended">Change Status To Suspended</option>
          </select>

          <button
            onClick={handleBulkAction}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedUsers.length === users.length}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fullname
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mobile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Regt Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-4 py-3">
                  <ActionIcons.Group>
                    <ActionIcons.Edit 
                      onClick={() => handleEditUser(user)}
                      title="Edit"
                    />
                    <ActionIcons.Delete 
                      onClick={() => handleDelete(user.id, user.fullname)}
                      title="Delete"
                    />
                  </ActionIcons.Group>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.id}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.fullname}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.mobile}</td>
                <td className="px-4 py-3 text-sm font-medium text-red-600">{user.role}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.regt_date}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name:</p>
                <p className="font-medium">{selectedUser.fullname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Status:</p>
                <p className={`font-medium ${selectedUser.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedUser.status}
                </p>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">Change Status:</p>
                <div className="flex gap-3">
                  {selectedUser.status !== 'Suspended' && (
                    <button
                      onClick={() => handleBanUser('Suspended')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Suspend User
                    </button>
                  )}
                  {selectedUser.status === 'Suspended' && (
                    <button
                      onClick={() => handleBanUser('Active')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Activate User
                    </button>
                  )}
                  {selectedUser.status !== 'Inactive' && selectedUser.status !== 'Suspended' && (
                    <button
                      onClick={() => handleBanUser('Inactive')}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
