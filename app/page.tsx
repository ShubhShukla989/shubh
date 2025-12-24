import { db } from '@/lib/db';
import { site_settings, editions, epaper_categories, layouts } from '@/lib/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import { redirect } from 'next/navigation';

async function getHomepageSettings() {
  try {
    const [data] = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.setting_key, 'home_page'))
      .limit(1);

    if (!data) {
      console.log('⚠️ No site settings found, creating defaults');
      // Auto-create default settings
      await db.insert(site_settings).values({
        setting_key: 'home_page',
        setting_value: 'website-homepage',
        homepage_layout: 'Website Homepage',
        homepage_type: 'normal'
      });
      return { page: 'website-homepage', layout: 'Website Homepage' };
    }

    console.log('✅ Site settings loaded:', data.setting_value);

    // Auto-heal missing homepage_layout
    let layoutName = data.homepage_layout;
    
    if (!layoutName) {
      // Map setting_value to correct layout name
      const layoutMapping = {
        'website-homepage': 'Website Homepage',
        'epaper-display': 'Epaper Display',
        'epaper-archive': 'Epaper Archive'
      };
      
      layoutName = layoutMapping[data.setting_value as keyof typeof layoutMapping] || 'Website Homepage';
      
      // Auto-fix the database
      await db
        .update(site_settings)
        .set({ homepage_layout: layoutName })
        .where(eq(site_settings.setting_key, 'home_page'));
      
      console.log(`🔧 Auto-fixed homepage_layout to: ${layoutName}`);
    }

    // Verify layout exists, if not fallback to Website Homepage
    const layoutExists = await db
      .select({ id: layouts.id })
      .from(layouts)
      .where(eq(layouts.name, layoutName))
      .limit(1);

    if (layoutExists.length === 0) {
      console.log(`⚠️ Layout "${layoutName}" not found, falling back to Website Homepage`);
      layoutName = 'Website Homepage';
      
      // Update database with working layout
      await db
        .update(site_settings)
        .set({ homepage_layout: layoutName })
        .where(eq(site_settings.setting_key, 'home_page'));
    }

    return {
      page: data.setting_value || 'website-homepage',
      layout: layoutName,
      categoryId: data.default_category_id
    };
  } catch (error) {
    console.error('❌ Exception fetching homepage settings:', error);
    return { page: 'website-homepage', layout: 'Website Homepage' };
  }
}

async function getFeaturedEditions() {
  try {
    const data = await db
      .select({ id: editions.id })
      .from(editions)
      .where(and(eq(editions.status, 'published'), eq(editions.is_featured, true)))
      .orderBy(desc(editions.date));

    return data;
  } catch (error) {
    return [];
  }
}

async function getLatestEdition(categoryId?: number) {
  try {
    let data;
    
    if (categoryId) {
      [data] = await db
        .select({ id: editions.id })
        .from(editions)
        .where(and(eq(editions.status, 'published'), eq(editions.category_id, categoryId)))
        .orderBy(desc(editions.date))
        .limit(1);
    } else {
      [data] = await db
        .select({ id: editions.id })
        .from(editions)
        .where(eq(editions.status, 'published'))
        .orderBy(desc(editions.date))
        .limit(1);
    }
    
    return data?.id || null;
  } catch (error) {
    return null;
  }
}

async function getFeaturedCategories() {
  try {
    const data = await db
      .select({ id: epaper_categories.id, alias: epaper_categories.alias })
      .from(epaper_categories)
      .where(eq(epaper_categories.is_featured, true))
      .orderBy(asc(epaper_categories.id));

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
  try {
    const data = await db
      .select({ id: epaper_categories.id })
      .from(epaper_categories);

    return data.length;
  } catch (error) {
    return 0;
  }
}

async function getDefaultCategory() {
  try {
    const [data] = await db
      .select({ alias: epaper_categories.alias })
      .from(epaper_categories)
      .orderBy(asc(epaper_categories.id))
      .limit(1);

    return data?.alias || null;
  } catch (error) {
    return null;
  }
}

async function getEditionsCount() {
  try {
    const data = await db
      .select({ id: editions.id })
      .from(editions)
      .where(eq(editions.status, 'published'));

    return data.length;
  } catch (error) {
    return 0;
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const settings = await getHomepageSettings();

  console.log('🏠 Homepage rendering with settings:', settings);

  // Handle different homepage types based on setting_value
  if (settings.page === 'epaper-display') {
    console.log('📰 Epaper Display mode activated');
    // Check for featured editions first
    const featuredEditions = await getFeaturedEditions();
    
    if (featuredEditions.length > 0) {
      // Redirect to first featured edition
      redirect(`/epaper/view/${featuredEditions[0].id}`);
    } else {
      // Fallback: latest edition
      const latestEditionId = await getLatestEdition();
      if (latestEditionId) {
        redirect(`/epaper/view/${latestEditionId}`);
      }
    }
  } else if (settings.page === 'epaper-archive') {
    console.log('📚 Epaper Archive mode activated');
    // Check for featured categories first
    const featuredCategoryAlias = await getFirstFeaturedCategory();
    console.log('Featured category:', featuredCategoryAlias);
    
    if (featuredCategoryAlias) {
      redirect(`/epaper/category/${featuredCategoryAlias}`);
    } else {
      // Fallback: first available category
      const fallbackCategoryAlias = await getDefaultCategory();
      if (fallbackCategoryAlias) {
        redirect(`/epaper/category/${fallbackCategoryAlias}`);
      } else {
        // If no categories at all, redirect to archive page
        redirect('/epaper/archive');
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
