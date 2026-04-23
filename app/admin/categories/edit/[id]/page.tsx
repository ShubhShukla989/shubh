'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/categories/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCategory(data.data);
          }
        });
    }
  }, [params.id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Category</h1>
      <p>Category ID: {params.id}</p>
      {category && <p>Name: {category.name}</p>}
    </div>
  );
}
