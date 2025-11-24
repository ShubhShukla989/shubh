'use client';

import { useEffect, useState } from 'react';

export default function DebugLayoutPage() {
  const [layoutData, setLayoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const response = await fetch('/api/layouts/epaper-archive', {
        cache: 'no-store',
      });
      const data = await response.json();
      setLayoutData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: epaper-archive Layout</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">API Response:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(layoutData, null, 2)}
        </pre>
      </div>

      {layoutData?.data?.structure && (
        <div className="mt-4 bg-blue-100 p-4 rounded">
          <h2 className="font-bold mb-2">Structure Details:</h2>
          <p>Rows: {layoutData.data.structure.rows?.length || 0}</p>
          {layoutData.data.structure.rows?.map((row: any, i: number) => (
            <div key={i} className="ml-4 mt-2">
              <p>Row {i}: {row.columns?.length || 0} columns</p>
              {row.columns?.map((col: any, j: number) => (
                <div key={j} className="ml-4">
                  <p>Column {j}: {col.widgets?.length || 0} widgets</p>
                  {col.widgets?.map((widget: any, k: number) => (
                    <div key={k} className="ml-4 text-sm">
                      <p>Widget {k}: {widget.type}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
