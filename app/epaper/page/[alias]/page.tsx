import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { Metadata } from 'next';
import PageWrapper from './PageWrapper';
import { SliderWidget } from '@/components/SliderWidget';
import { MenuWidget } from '@/components/MenuWidget';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

interface PageProps {
  params: {
    alias: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPage(params.alias);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
    keywords: page.meta_keywords || undefined,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || undefined,
      images: page.og_image ? [page.og_image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.twitter_title || page.meta_title || page.title,
      description: page.twitter_description || page.meta_description || undefined,
      images: page.twitter_image ? [page.twitter_image] : [],
    },
  };
}

async function getPage(alias: string) {
  try {
    console.log('Fetching page with alias:', alias);
    
    const [data] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.alias, alias), eq(pages.status, 'Public')))
      .limit(1);

    if (!data) {
      console.error('Page not found with alias:', alias);
      
      const [debugData] = await db
        .select({ alias: pages.alias, status: pages.status })
        .from(pages)
        .where(eq(pages.alias, alias))
        .limit(1);
      
      if (debugData) {
        console.log('Page exists but status is:', debugData.status);
      } else {
        console.log('Page does not exist with alias:', alias);
      }
      
      return null;
    }

    console.log('Page found:', data?.title);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PageView({ params }: PageProps) {
  const page = await getPage(params.alias);

  if (!page) {
    notFound();
  }

  // Replace template variables
  const processContent = (content: string) => {
    return content
      .replace(/\{\{site_name\}\}/g, 'Do Boje Dopahar')
      .replace(/\{\{site_url\}\}/g, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
      .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString())
      .replace(/\{\{page_title\}\}/g, page.title)
      .replace(/\{\{page_url\}\}/g, `/epaper/page/${page.alias}`);
  };

  return (
    <PageWrapper headerCode={page.header_code || undefined} footerCode={page.footer_code || undefined}>
      <div className="px-4 md:px-8 py-8">
          <article>
            {/* Page Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {page.title}
            </h1>
            {/* Orange Underline */}
            <div className="w-20 h-1 bg-orange-500 mb-6"></div>

            {/* Page Content */}
            {(() => {
              // Note: layout_name field removed from schema
              // Pages now use content field for layout data
              
              // Check if content is designer layout (old format)
              try {
                const parsed = JSON.parse(page.content || '{}');
                if (parsed.mode === 'designer') {
                  return (
                    <div>
                      {/* Custom CSS */}
                      {parsed.customCss && (
                        <style dangerouslySetInnerHTML={{ __html: parsed.customCss }} />
                      )}
                      
                      {/* Layout Structure */}
                      <div className="designer-layout">
                        {parsed.structure?.rows?.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="row mb-4" style={{ minHeight: row.height || 'auto' }}>
                            <div className="flex gap-4 flex-wrap">
                              {row.columns?.map((col: any, colIndex: number) => (
                                <div
                                  key={colIndex}
                                  className="column"
                                  style={{ flex: col.width || 1 }}
                                >
                                  {col.widgets?.map((widget: any, widgetIndex: number) => (
                                    <div key={widgetIndex} className="widget mb-4">
                                      {widget.type === 'text' && (
                                        <div dangerouslySetInnerHTML={{ __html: widget.content || '' }} />
                                      )}
                                      {widget.type === 'image' && widget.url && (
                                        <img src={widget.url} alt={widget.alt || ''} className="w-full rounded" />
                                      )}
                                      {widget.type === 'button' && (
                                        <a
                                          href={widget.link || '#'}
                                          className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                          {widget.text || 'Button'}
                                        </a>
                                      )}
                                      {widget.type === 'slideshow' && widget.config?.sliderAlias && (
                                        <SliderWidget
                                          alias={widget.config.sliderAlias}
                                          autoplay={widget.config.autoplay !== false}
                                          interval={widget.config.interval || 5000}
                                          showArrows={widget.config.showArrows !== false}
                                          showDots={widget.config.showDots !== false}
                                          className="h-96"
                                        />
                                      )}
                                      {widget.type === 'embed' && widget.code && (
                                        <div dangerouslySetInnerHTML={{ __html: widget.code }} />
                                      )}
                                      {widget.type === 'menu' && (
                                        <MenuWidget config={widget.config || {}} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Custom JS */}
                      {parsed.customJs && (
                        <script dangerouslySetInnerHTML={{ __html: parsed.customJs }} />
                      )}
                    </div>
                  );
                }
              } catch (e) {
                // Not JSON or not designer mode, render as HTML
              }
              
              // Default: render as HTML
              return (
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-gray-900
                    prose-p:text-gray-700
                    prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900
                    prose-ul:text-gray-700
                    prose-ol:text-gray-700
                    prose-blockquote:border-red-600 prose-blockquote:text-gray-700
                    prose-code:text-red-600 prose-code:bg-red-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-lg prose-img:shadow-md"
                  dangerouslySetInnerHTML={{
                    __html: processContent(page.content || ''),
                  }}
                />
              );
            })()}
          </article>
      </div>
    </PageWrapper>
  );
}
