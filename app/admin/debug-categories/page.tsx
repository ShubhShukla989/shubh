'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  title: string;
  alias: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

export default function DebugCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/epaper/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPublish = async (categoryId: number, categoryName: string) => {
    setTestResult(`Testing publish with ${categoryName}...`);
    
    try {
      const testEdition = {
        title: `Test Edition - ${categoryName} - ${Date.now()}`,
        alias: `test-${categoryName.toLowerCase()}-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category_id: categoryId,
        description: 'Test edition for debugging',
        status: 'published',
      };

      const response = await fetch('/api/editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEdition),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult(`✅ SUCCESS: ${categoryName} edition published successfully!\nEdition ID: ${result.data.id}`);
      } else {
        setTestResult(`❌ FAILED: ${categoryName} edition failed to publish\nError: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fixAllCategories = async () => {
    if (!confirm('This will activate ALL inactive categories. Continue?')) return;
    
    setFixing(true);
    try {
      const response = await fetch('/api/debug/fix-categories', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.message}\n\nFixed categories:\n${result.data.categories.map((c: any) => `- ${c.title}`).join('\n')}`);
        fetchCategories();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('Failed to fix categories');
    } finally {
      setFixing(false);
    }
  };

  const toggleActive = async (id: number, currentActive: boolean, title: string) => {
    if (!confirm(`Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} "${title}"?`)) return;

    try {
      const getResponse = await fetch(`/api/epaper/categories/${id}`);
      const getResult = await getResponse.json();
      
      if (!getResult.success) {
        alert('Error: ' + getResult.error);
        return;
      }

      const category = getResult.data;

      const response = await fetch(`/api/epaper/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...category,
          is_active: !currentActive,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Category ${currentActive ? 'deactivated' : 'activated'} successfully`);
        fetchCategories();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to toggle category');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Category Debug Tool</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-yellow-800 mb-2">🔍 Diagnostic Information</h2>
            <p className="text-sm text-yellow-700">
              This page helps diagnose why editions might not publish for certain categories.
              Check if categories are active and test publishing with each category.
            </p>
          </div>
          <button
            onClick={fixAllCategories}
            disabled={fixing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium whitespace-nowrap"
          >
            {fixing ? 'Fixing...' : '🔧 Fix All Inactive'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Alias</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Featured</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                      !category.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">{category.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{category.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{category.alias}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          category.is_featured
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => toggleActive(category.id, category.is_active, category.title)}
                        className={`px-3 py-1 text-xs rounded ${
                          category.is_active
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {category.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => testPublish(category.id, category.title)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Test Publish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {testResult && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {testResult}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Common Issues:</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>If a category shows as "Inactive", click "Activate" to enable it</li>
              <li>Use "Test Publish" to verify if publishing works for each category</li>
              <li>Check browser console (F12) for detailed error messages</li>
              <li>Ensure the category exists in the database</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
