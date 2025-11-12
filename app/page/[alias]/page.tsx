import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';

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
  if (!supabaseAdmin) {
    console.error('Supabase not configured');
    return null;
  }

  try {
    console.log('Fetching page with alias:', alias);
    
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('alias', alias)
      .eq('status', 'Public')
      .single();

    if (error) {
      console.error('Error fetching page:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Try without status filter to debug
      const { data: debugData } = await supabaseAdmin
        .from('pages')
        .select('alias, status')
        .eq('alias', alias)
        .single();
      
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
      .replace(/\{\{site_name\}\}/g, 'ePaper CMS Cloud')
      .replace(/\{\{site_url\}\}/g, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
      .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString())
      .replace(/\{\{page_title\}\}/g, page.title)
      .replace(/\{\{page_url\}\}/g, `/page/${page.alias}`);
  };

  return (
    <>
      {/* Header Code Injection */}
      {page.header_code && (
        <div dangerouslySetInnerHTML={{ __html: page.header_code }} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-2xl font-bold text-purple-600">
                ePaper CMS
              </a>
              <nav className="flex gap-6">
                <a href="/" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Home
                </a>
                <a href="/admin" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Admin
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            {/* Page Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {page.title}
            </h1>

            {/* Page Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
              <time dateTime={page.created_at}>
                Published: {new Date(page.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {page.updated_at !== page.created_at && (
                <span>
                  • Updated: {new Date(page.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {/* Page Content */}
            {(() => {
              // Check if content is designer layout
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
                            <div className="flex gap-4">
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
                                          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                        >
                                          {widget.text || 'Button'}
                                        </a>
                                      )}
                                      {widget.type === 'embed' && widget.code && (
                                        <div dangerouslySetInnerHTML={{ __html: widget.code }} />
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
                    prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900
                    prose-ul:text-gray-700
                    prose-ol:text-gray-700
                    prose-blockquote:border-purple-600 prose-blockquote:text-gray-700
                    prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-lg prose-img:shadow-md"
                  dangerouslySetInnerHTML={{
                    __html: processContent(page.content || ''),
                  }}
                />
              );
            })()}
          </article>

          {/* Back to Admin Link */}
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <a
              href="/admin/pages"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </a>
          </div>
        </main>

        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} ePaper CMS Cloud. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Footer Code Injection */}
      {page.footer_code && (
        <div dangerouslySetInnerHTML={{ __html: page.footer_code }} />
      )}
    </>
  );
}
