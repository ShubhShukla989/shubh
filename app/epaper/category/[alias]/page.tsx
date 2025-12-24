import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import { CategoryProvider } from '@/contexts/CategoryContext';

interface CategoryPageProps {
  params: {
    alias: string;
  };
}

async function getCategory(alias: string) {
  try {
    // Check if alias is in format "id-123"
    if (alias.startsWith('id-')) {
      const id = parseInt(alias.replace('id-', ''));
      const [data] = await db
        .select()
        .from(epaper_categories)
        .where(eq(epaper_categories.id, id))
        .limit(1);

      return data || null;
    }

    // Otherwise fetch by alias
    const [data] = await db
      .select()
      .from(epaper_categories)
      .where(eq(epaper_categories.alias, alias))
      .limit(1);

    return data || null;
  } catch (error) {
    return null;
  }
}

async function getCategoryLayout(categoryId: number) {
  try {
    const [data] = await db
      .select({ archive_layout: epaper_categories.archive_layout })
      .from(epaper_categories)
      .where(eq(epaper_categories.id, categoryId))
      .limit(1);

    // If category has specific layout, use it
    if (data?.archive_layout) {
      return data.archive_layout;
    }

    // Otherwise, use default category archive layout
    return 'Epaper Archive';
  } catch (error) {
    // Fallback to default layout
    return 'Epaper Archive';
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
  // Force use Epaper Archive layout for now
  const finalLayout = 'Epaper Archive';
  
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
