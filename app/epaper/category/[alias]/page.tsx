import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { CategoryArchiveContent } from './CategoryArchiveContent';
import { buildOgMetadata, buildNotFoundMetadata, safeMetadata } from '@/lib/metadata';

interface CategoryPageProps {
  params: {
    alias: string;
  };
}

interface Category {
  id: number;
  title: string;
  alias: string;
  archive_layout?: string | null;
}

async function getCategory(alias: string): Promise<Category | null> {
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

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { alias: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const category = await getCategory(params.alias);
      if (!category) return buildNotFoundMetadata('Category');

      return buildOgMetadata({
        title: `${category.title} — Archive`,
        description: `Browse all editions in ${category.title}`,
        image: null, // no image in schema → falls back to DEFAULT_OG via helper
        url: `/epaper/category/${params.alias}`,
      });
    },
    buildNotFoundMetadata('Category'),
    `category-metadata-${params.alias}`
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategory(params.alias);

  if (!category) {
    notFound();
  }
  
  return (
    <CategoryProvider
      categoryId={category.id}
      categoryAlias={category.alias}
      categoryTitle={category.title}
    >
      <CategoryArchiveContent category={category} />
    </CategoryProvider>
  );
}
