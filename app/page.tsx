import { supabaseAdmin } from '@/lib/supabase';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import { redirect } from 'next/navigation';

async function getHomepageSettings() {
  if (!supabaseAdmin) {
    return { page: 'website-homepage', layout: 'Website Homepage' };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching site settings:', error);
      return { page: 'website-homepage', layout: 'Website Homepage' };
    }

    return {
      page: data.setting_value || 'website-homepage',
      layout: data.homepage_layout || 'Website Homepage',
      categoryId: data.default_category_id
    };
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return { page: 'website-homepage', layout: 'Website Homepage' };
  }
}

async function getLatestEdition(categoryId?: number) {
  if (!supabaseAdmin) return null;

  try {
    let query = supabaseAdmin
      .from('editions')
      .select('id')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(1);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.single();
    
    if (error || !data) return null;
    return data.id;
  } catch (error) {
    return null;
  }
}

async function getFeaturedCategories() {
  if (!supabaseAdmin) return [];

  try {
    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('id, alias')
      .eq('is_featured', true)
      .order('id', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (error) {
    return [];
  }
}

async function getFirstFeaturedCategory() {
  const featuredCategories = await getFeaturedCategories();
  return featuredCategories.length > 0 ? featuredCategories[0].alias : null;
}

async function getFirstFeaturedCategoryId() {
  const featuredCategories = await getFeaturedCategories();
  return featuredCategories.length > 0 ? featuredCategories[0].id : null;
}

async function getCategoriesCount() {
  if (!supabaseAdmin) return 0;

  try {
    const { count, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

async function getDefaultCategory() {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('alias')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.alias;
  } catch (error) {
    return null;
  }
}

async function getEditionsCount() {
  if (!supabaseAdmin) return 0;

  try {
    const { count, error } = await supabaseAdmin
      .from('editions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const settings = await getHomepageSettings();

  // Handle different homepage types based on setting_value
  if (settings.page === 'epaper-display') {
    // Redirect to latest edition
    const featuredCategoryId = await getFirstFeaturedCategoryId();
    const editionId = await getLatestEdition(featuredCategoryId || undefined);
    
    if (editionId) {
      redirect(`/epaper/view/${editionId}`);
    } else {
      // Fallback: overall latest edition
      const fallbackEditionId = await getLatestEdition();
      if (fallbackEditionId) {
        redirect(`/epaper/view/${fallbackEditionId}`);
      }
    }
  } else if (settings.page === 'epaper-archive') {
    // Redirect to category archive
    const featuredCategoryAlias = await getFirstFeaturedCategory();
    
    if (featuredCategoryAlias) {
      redirect(`/epaper/category/${featuredCategoryAlias}`);
    } else {
      // Fallback: first available category
      const fallbackCategoryAlias = await getDefaultCategory();
      if (fallbackCategoryAlias) {
        redirect(`/epaper/category/${fallbackCategoryAlias}`);
      }
    }
  }

  // Default: render website homepage with layout
  return (
    <div className="homepage w-full">
      <LayoutRenderer layoutName={settings.layout} />
    </div>
  );
}
