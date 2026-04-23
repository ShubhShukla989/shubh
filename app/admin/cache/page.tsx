'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  connected: boolean;
  totalKeys: number;
  hits: string;
  misses: string;
  hitRate: string;
  memoryUsed: string;
}

export default function CachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const warmCache = async () => {
    if (!confirm('Warm cache with common data?')) {
      return;
    }
    
    setWarming(true);
    try {
      const response = await fetch('/api/cache/warm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchStats();
      } else {
        alert('Failed to warm cache: ' + data.error);
      }
    } catch (error) {
      console.error('Error warming cache:', error);
      alert('Failed to warm cache');
    } finally {
      setWarming(false);
    }
  };
  
  const clearCache = async (pattern?: string) => {
    const message = pattern 
      ? `Clear cache matching pattern: ${pattern}?`
      : 'Clear ALL cache? This cannot be undone.';
      
    if (!confirm(message)) {
      return;
    }
    
    setClearing(true);
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchStats();
      } else {
        alert('Failed to clear cache: ' + data.error);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  // 🔥 NEW: Comprehensive cache clear with Next.js revalidation
  const clearCacheComprehensive = async (type: string = 'all') => {
    const messages = {
      categories: 'Clear category cache and revalidate pages?',
      editions: 'Clear edition cache and revalidate pages?',
      layouts: 'Clear layout cache and revalidate pages?',
      all: 'Clear ALL cache and revalidate ALL pages? This will refresh everything.'
    };
    
    if (!confirm(messages[type as keyof typeof messages] || messages.all)) {
      return;
    }
    
    setClearing(true);
    try {
      // Use existing cache clear endpoint with pattern
      const patterns = {
        categories: 'categories:*',
        editions: 'edition:*',
        layouts: 'layout:*',
        all: undefined // Clear all
      };
      
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: patterns[type as keyof typeof patterns] })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}\n\nCache cleared for: ${type}`);
        fetchStats();
      } else {
        alert('Failed to clear cache: ' + data.error);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!stats?.connected) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Cache Management</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Redis Not Connected</h2>
          <p className="text-gray-600 mb-4">
            Redis is not available. The system is running without cache.
          </p>
          <p className="text-sm text-gray-500">
            To enable caching, install Redis and configure REDIS_URL in .env.local
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cache Management</h1>
        <div className="flex gap-2">
          <button
            onClick={warmCache}
            disabled={warming}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {warming ? '🔥 Warming...' : '🔥 Warm Cache'}
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Total Keys</div>
              <div className="text-3xl font-bold">{stats.totalKeys}</div>
            </div>
            <div className="text-4xl">🔑</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Cache Hits</div>
              <div className="text-3xl font-bold text-green-600">{stats.hits}</div>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Cache Misses</div>
              <div className="text-3xl font-bold text-red-600">{stats.misses}</div>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Hit Rate</div>
              <div className="text-3xl font-bold text-blue-600">{stats.hitRate}</div>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>
      
      {/* Memory Usage */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-1">Memory Used</div>
            <div className="text-2xl font-bold">{stats.memoryUsed}</div>
          </div>
          <div className="text-4xl">💾</div>
        </div>
      </div>
      
      {/* Performance Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">📈 Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">Cache Efficiency</div>
            <div className="text-gray-600">
              {parseFloat(stats.hitRate) > 90 ? '🟢 Excellent' : 
               parseFloat(stats.hitRate) > 70 ? '🟡 Good' : 
               '🔴 Needs Improvement'}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Recommendation</div>
            <div className="text-gray-600">
              {parseFloat(stats.hitRate) > 90 ? 'Cache is performing well' : 
               'Consider warming cache or increasing TTL'}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Status</div>
            <div className="text-green-600 font-medium">✅ Connected</div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🔥 Smart Cache Actions (Recommended)</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded border border-green-200">
            <div>
              <div className="font-medium text-green-700">Clear Category Cache + Revalidate</div>
              <div className="text-sm text-green-600">✅ Clears Redis + Next.js routes automatically</div>
            </div>
            <button
              onClick={() => clearCacheComprehensive('categories')}
              disabled={clearing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Smart Clear Categories'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded border border-blue-200">
            <div>
              <div className="font-medium text-blue-700">Clear Edition Cache + Revalidate</div>
              <div className="text-sm text-blue-600">✅ Clears Redis + Next.js routes automatically</div>
            </div>
            <button
              onClick={() => clearCacheComprehensive('editions')}
              disabled={clearing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Smart Clear Editions'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded border border-purple-200">
            <div>
              <div className="font-medium text-purple-700">Clear Layout Cache + Revalidate</div>
              <div className="text-sm text-purple-600">✅ Clears Redis + Next.js routes automatically</div>
            </div>
            <button
              onClick={() => clearCacheComprehensive('layouts')}
              disabled={clearing}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Smart Clear Layouts'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded border border-red-200">
            <div>
              <div className="font-medium text-red-700">Clear Everything + Revalidate All</div>
              <div className="text-sm text-red-600">⚠️ Nuclear option - clears all cache + revalidates all pages</div>
            </div>
            <button
              onClick={() => clearCacheComprehensive('all')}
              disabled={clearing}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : '🚀 Smart Clear Everything'}
            </button>
          </div>
        </div>

        <hr className="my-6" />
        
        <h3 className="text-lg font-semibold mb-4">⚙️ Manual Cache Actions (Advanced)</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Clear Layout Cache (Redis Only)</div>
              <div className="text-sm text-gray-600">Clear all cached layouts (manual)</div>
            </div>
            <button
              onClick={() => clearCache('layout:*')}
              disabled={clearing}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Layouts
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Clear Edition Cache (Redis Only)</div>
              <div className="text-sm text-gray-600">Clear all cached editions (manual)</div>
            </div>
            <button
              onClick={() => clearCache('edition:*')}
              disabled={clearing}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Editions
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Clear Category Cache (Redis Only)</div>
              <div className="text-sm text-gray-600">Clear all cached categories (manual)</div>
            </div>
            <button
              onClick={() => clearCache('categories:*')}
              disabled={clearing}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Categories
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <div className="font-medium">Clear All Cache (Redis Only)</div>
              <div className="text-sm text-gray-600">⚠️ This will clear everything (manual)</div>
            </div>
            <button
              onClick={() => clearCache()}
              disabled={clearing}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Stats auto-refresh every 5 seconds
      </div>
    </div>
  );
}
