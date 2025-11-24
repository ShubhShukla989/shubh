'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  title: string;
  alias: string;
  is_active: boolean;
}

export default function DebugEditionCreatePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    }
  };

  const testCategory = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    setTestResult('Testing category...');

    try {
      // Test 1: Check if category exists
      setTestResult('Step 1: Checking if category exists...');
      const categoryId = parseInt(selectedCategory, 10);
      const category = categories.find(c => c.id === categoryId);
      
      if (!category) {
        setTestResult(`❌ FAILED: Category ID ${categoryId} not found in list`);
        setLoading(false);
        return;
      }

      setTestResult(`✅ Step 1 passed: Category found - ${category.title}\n\nStep 2: Testing API endpoint...`);

      // Test 2: Test with API
      const testResponse = await fetch('/api/debug/test-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });

      const testData = await testResponse.json();
      
      if (!testData.success) {
        setTestResult(
          `❌ FAILED at Step 2: API Test\n\n` +
          `Error: ${testData.error}\n\n` +
          `Details:\n${JSON.stringify(testData.details, null, 2)}`
        );
        setLoading(false);
        return;
      }

      setTestResult(
        `✅ Step 2 passed: API test successful\n\n` +
        `Step 3: Creating actual edition...`
      );

      // Test 3: Create actual edition
      const editionPayload = {
        title: `Test Edition - ${category.title} - ${Date.now()}`,
        alias: `test-${category.alias}-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category_id: categoryId,
        description: 'Test edition for debugging',
        status: 'draft',
      };

      console.log('Creating edition with payload:', editionPayload);

      const editionResponse = await fetch('/api/editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editionPayload),
      });

      const editionData = await editionResponse.json();
      console.log('Edition creation response:', editionData);

      if (!editionData.success) {
        setTestResult(
          `❌ FAILED at Step 3: Edition Creation\n\n` +
          `Error: ${editionData.error}\n\n` +
          `Payload sent:\n${JSON.stringify(editionPayload, null, 2)}`
        );
        setLoading(false);
        return;
      }

      setTestResult(
        `✅ ALL TESTS PASSED! 🎉\n\n` +
        `Category: ${category.title} (ID: ${categoryId})\n` +
        `Edition created successfully!\n` +
        `Edition ID: ${editionData.data.id}\n\n` +
        `This category works perfectly!`
      );

    } catch (error) {
      setTestResult(
        `❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `Check browser console for details`
      );
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAllCategories = async () => {
    setLoading(true);
    let results = '🧪 Testing all categories...\n\n';
    setTestResult(results);

    for (const category of categories) {
      results += `Testing: ${category.title} (ID: ${category.id})...\n`;
      setTestResult(results);

      try {
        const testResponse = await fetch('/api/debug/test-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: category.id }),
        });

        const testData = await testResponse.json();

        if (testData.success) {
          results += `  ✅ WORKS\n`;
        } else {
          results += `  ❌ FAILED: ${testData.error}\n`;
        }
      } catch (error) {
        results += `  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown'}\n`;
      }

      results += '\n';
      setTestResult(results);
    }

    results += '\n✅ Testing complete!';
    setTestResult(results);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Edition Creation</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">🔍 Purpose</h2>
        <p className="text-sm text-blue-700">
          This tool helps diagnose why edition creation fails with certain categories.
          It tests each step of the process to identify where the problem occurs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Test Form */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Category</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category to Test
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Category --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title} (ID: {category.id}) {!category.is_active && '- INACTIVE'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={testCategory}
                disabled={loading || !selectedCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Testing...' : 'Test Selected Category'}
              </button>
              <button
                onClick={testAllCategories}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loading ? 'Testing...' : 'Test All Categories'}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Available Categories:</h3>
            <div className="space-y-1 text-sm">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <span>{cat.title}</span>
                  <span className="text-gray-500">ID: {cat.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResult ? (
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded border overflow-auto max-h-[600px]">
              {testResult}
            </pre>
          ) : (
            <div className="text-gray-500 text-center py-12">
              Select a category and click "Test" to see results
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 What This Tests:</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li><strong>Step 1:</strong> Checks if category exists in the fetched list</li>
          <li><strong>Step 2:</strong> Tests if category exists in database and can be referenced</li>
          <li><strong>Step 3:</strong> Attempts to create an actual edition with the category</li>
        </ul>
      </div>

      <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
        <h3 className="font-semibold text-green-800 mb-2">✅ If All Tests Pass:</h3>
        <p className="text-sm text-green-700">
          The category works correctly! The issue might be with how you're selecting or submitting the form.
          Check the browser console for any JavaScript errors.
        </p>
      </div>

      <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
        <h3 className="font-semibold text-red-800 mb-2">❌ If Tests Fail:</h3>
        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
          <li>Check if the category is active in the database</li>
          <li>Verify the category_id exists in epaper_categories table</li>
          <li>Check for foreign key constraint issues</li>
          <li>Look at the detailed error message in the results</li>
        </ul>
      </div>
    </div>
  );
}
