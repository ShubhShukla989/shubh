'use client';

import { useRouter } from 'next/navigation';
import CategoryForm from '@/components/admin/CategoryForm';

export default function CreateCategoryPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    console.log('📝 Creating category with data:', formData);
    
    const response = await fetch('/api/epaper/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    console.log('📊 Create category response:', result);

    if (result.success) {
      alert('Category created successfully!');
      router.push('/admin/epaper/categories');
    } else {
      console.error('❌ Category creation failed:', result.error);
      alert('Error: ' + result.error);
      throw new Error(result.error);
    }
  };

  return (
    <CategoryForm 
      mode="create" 
      onSubmit={handleSubmit}
    />
  );
}