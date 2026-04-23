import { db } from '@/lib/db';
import { site_settings, editions, epaper_categories, layouts } from '@/lib/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

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
      
      // Auto-fix the database (non-blocking)
      db.update(site_settings)
        .set({ homepage_layout: layoutName })
        .where(eq(site_settings.setting_key, 'home_page'))
        .catch(() => {}); // Silent fail
      
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
      
      // Update database with working layout (non-blocking)
      db.update(site_settings)
        .set({ homepage_layout: layoutName })
        .where(eq(site_settings.setting_key, 'home_page'))
        .catch(() => {}); // Silent fail
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
      .select({ id: epaper_categories.id })
      .from(epaper_categories)
      .orderBy(asc(epaper_categories.id))
      .limit(1);

    return data?.id || null;
  } catch (error) {
    return null;
  }
}

async function getDefaultCategoryAlias() {
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

// ISR with on-demand revalidation for fresh content + performance
export const revalidate = 60; // 60 seconds (on-demand handles instant updates, ISR is fallback)

export default async function HomePage() {
  const settings = await getHomepageSettings();

  console.log('🏠 Homepage rendering with settings:', settings);

  // Always render on "/" - no redirects for clean URL
  // Content changes based on settings, but URL stays "/"
  
  if (settings.page === 'epaper-display') {
    console.log('📰 Epaper Display mode - rendering on homepage');
    
    // Parallel fetch for better performance
    const [featuredEditions, latestEdition] = await Promise.all([
      getFeaturedEditions(),
      getLatestEdition()
    ]);
    
    const editionId = featuredEditions.length > 0 
      ? featuredEditions[0].id 
      : latestEdition;
    
    if (editionId) {
      // Render StaticEpaperLayout on homepage (no redirect)
      const { StaticEpaperLayout } = await import('@/components/epaper/StaticEpaperLayout');
      return (
        <div className="homepage w-full">
          <StaticEpaperLayout editionId={editionId.toString()} />
        </div>
      );
    }
  } else if (settings.page === 'epaper-archive') {
    console.log('📚 Epaper Archive mode - rendering on homepage');
    
    // Parallel fetch for better performance
    const [featuredCategoryAlias, defaultCategoryAlias] = await Promise.all([
      getFirstFeaturedCategory(),
      getDefaultCategoryAlias()
    ]);
    
    const categoryAlias = featuredCategoryAlias || defaultCategoryAlias;
    
    if (categoryAlias) {
      // Fetch category data
      const [category] = await db
        .select()
        .from(epaper_categories)
        .where(eq(epaper_categories.alias, categoryAlias))
        .limit(1);
      
      if (category) {
        // Render CategoryArchiveContent on homepage (no redirect)
        const { CategoryArchiveContent } = await import('@/app/epaper/category/[alias]/CategoryArchiveContent');
        return (
          <div className="homepage w-full">
            <CategoryArchiveContent category={category} />
          </div>
        );
      }
    }
  }

  // Default: render website homepage with layout
  return (
    <div className="homepage w-full" style={{ backgroundColor: 'white' }}>
      <div style={{ marginLeft: '10%', marginRight: '10%' }}>
        <LayoutRenderer layoutName={settings.layout} />
      </div>
    </div>
  );
}
