'use client';

import { useState, useEffect } from 'react';
import { Save, Shield, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionsByCategory {
  [category: string]: Permission[];
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Load all permissions
      const permRes = await fetch('/api/permissions');
      const permData = await permRes.json();
      
      if (permData.success) {
        setPermissions(permData.data || []);
      }

      // Load Admin role permissions
      const adminPermRes = await fetch('/api/permissions/role/2'); // Role ID 2 = Admin
      const adminPermData = await adminPermRes.json();
      
      if (adminPermData.success) {
        const permKeys = new Set<string>(adminPermData.data.map((p: any) => p.permission_key as string));
        setAdminPermissions(permKeys);
      }
    } catch (error) {
      alert('❌ Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionKey: string) => {
    const newPermissions = new Set(adminPermissions);
    if (newPermissions.has(permissionKey)) {
      newPermissions.delete(permissionKey);
    } else {
      newPermissions.add(permissionKey);
    }
    setAdminPermissions(newPermissions);
  };

  const handleSelectAll = (category: string) => {
    const categoryPerms = permissions.filter(p => p.category === category);
    const newPermissions = new Set(adminPermissions);
    
    const allSelected = categoryPerms.every(p => newPermissions.has(p.key));
    
    if (allSelected) {
      // Deselect all in category
      categoryPerms.forEach(p => newPermissions.delete(p.key));
    } else {
      // Select all in category
      categoryPerms.forEach(p => newPermissions.add(p.key));
    }
    
    setAdminPermissions(newPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/permissions/role/2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: Array.from(adminPermissions),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Admin permissions updated successfully!');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory: PermissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as PermissionsByCategory);

  const categories = Object.keys(permissionsByCategory).sort();

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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-500 flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              Admin Permissions
            </h1>
            <p className="text-gray-600 mt-1">
              Control what Admin users can access
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Super Admin always has full access to all features. 
          Use checkboxes below to control what Admin users can access.
        </p>
      </div>

      {/* Permissions Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryPerms = permissionsByCategory[category];
              const allSelected = categoryPerms.every(p => adminPermissions.has(p.key));
              const someSelected = categoryPerms.some(p => adminPermissions.has(p.key));
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-500 flex items-center gap-2">
                      {category}
                      <span className="text-xs text-gray-500 font-normal">
                        ({categoryPerms.filter(p => adminPermissions.has(p.key)).length}/{categoryPerms.length} selected)
                      </span>
                    </h3>
                    <button
                      onClick={() => handleSelectAll(category)}
                      className={`text-sm px-3 py-1 rounded ${
                        allSelected
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  {/* Permissions List */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryPerms.map((permission) => (
                        <label
                          key={permission.key}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            adminPermissions.has(permission.key)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={adminPermissions.has(permission.key)}
                            onChange={() => handleTogglePermission(permission.key)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-500 text-sm">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Permissions Selected: {adminPermissions.size} / {permissions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Admin users will only be able to access features you've enabled above
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
