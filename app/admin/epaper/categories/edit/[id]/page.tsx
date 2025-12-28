'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CategoryForm from '@/components/admin/CategoryForm';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/epaper/categories/${categoryId}`);
      const result = await response.json();

      if (result.success) {
        setInitialData(result.data);
      } else {
        alert('Failed to load category');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    const response = await fetch(`/api/epaper/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      alert('Category updated successfully!');
      router.push('/admin/epaper/categories');
    } else {
      alert('Error: ' + result.error);
      throw new Error(result.error);
    }
  };

  return (
    <CategoryForm 
      mode="edit" 
      categoryId={categoryId}
      initialData={initialData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}