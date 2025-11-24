import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import { CategoryProvider } from '@/contexts/CategoryContext';

interface CategoryPageProps {
  params: {
    alias: string;
  };
}

async function getCategory(alias: string) {
  if (!supabaseAdmin) return null;

  try {
    // Check if alias is in format "id-123"
    if (alias.startsWith('id-')) {
      const id = parseInt(alias.replace('id-', ''));
      const { data, error } = await supabaseAdmin
        .from('epaper_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    }

    // Otherwise fetch by alias
    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('*')
      .eq('alias', alias)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

async function getCategoryLayout(categoryId: number) {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('archive_layout')
      .eq('id', categoryId)
      .single();

    // If category has specific layout, use it
    if (!error && data?.archive_layout) {
      return data.archive_layout;
    }

    // Otherwise, use default category archive layout
    return 'epaper-archive';
  } catch (error) {
    // Fallback to default layout
    return 'epaper-archive';
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategory(params.alias);

  if (!category) {
    notFound();
  }

  // Check if category has a custom layout from Page Designer
  const categoryLayout = await getCategoryLayout(category.id);

  // Always render with layout (either custom or default)
  // Force use epaper-archive layout for now
  const finalLayout = 'epaper-archive';
  
  return (
    <CategoryProvider
      categoryId={category.id}
      categoryAlias={category.alias}
      categoryTitle={category.title}
    >
      <div className="category-archive-page">
        <LayoutRenderer layoutName={finalLayout} />
      </div>
    </CategoryProvider>
  );
}
