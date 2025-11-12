'use client';

import { useState, useEffect } from 'react';
import ActionIcons from '@/components/ActionIcons';

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
  const [users, setUsers] = useState<User[]>([
    {
      id: 4,
      fullname: 'Sushma Gupta',
      email: '99sushmagupta@gmail.com',
      mobile: '',
      role: 'Admin',
      regt_date: 'May 17, 2023, 2:24 am',
      status: 'ACTIVE',
    },
    {
      id: 1,
      fullname: 'India Ground report',
      email: 'indiagroundreport@gmail.com',
      mobile: '',
      role: 'Super Admin',
      regt_date: 'November 26, 2018, 10:04 pm',
      status: 'ACTIVE',
    },
  ]);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('09 Sep 2001');
  const [toDate, setToDate] = useState('12 Nov 2025');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete user "${name}"?`)) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users Manager</h1>
      </div>

      {/* New User Button */}
      <div className="mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition-colors">
          <ActionIcons.Add className="!p-0 !bg-transparent" />
          New User
        </button>
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
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
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
            <option value="active">Change Status To Active</option>
            <option value="banned">Change Status To Banned</option>
            <option value="pending">Change Status To Pending</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Actions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Fullname
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Mobile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Regt Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
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
                    <ActionIcons.Edit title="Edit" />
                    <ActionIcons.Delete 
                      onClick={() => handleDelete(user.id, user.fullname)}
                      title="Delete"
                    />
                  </ActionIcons.Group>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.fullname}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.mobile}</td>
                <td className="px-4 py-3 text-sm font-medium text-red-600">{user.role}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.regt_date}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
