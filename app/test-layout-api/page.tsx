'use client';

import { useEffect, useState } from 'react';

export default function TestLayoutAPI() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/layouts/epaper-archive?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Layout API Test</h1>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
