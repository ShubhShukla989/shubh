import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StaticEpaperLayout } from '@/components/epaper/StaticEpaperLayout';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getCompleteEdition } from '@/lib/services/editionService';
import { buildOgMetadata, buildNotFoundMetadata, safeMetadata, ogImageUrl } from '@/lib/metadata';
import { ArticleJsonLd } from '@/components/JsonLd';

// Revalidate every 5 minutes — editions don't change frequently.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { editionId: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const editionId = parseInt(params.editionId);
      if (isNaN(editionId)) return buildNotFoundMetadata('Edition');

      // getCompleteEdition is deduplicated by Next.js — same call in the page below
      // hits the DB exactly once per request
      const data = await getCompleteEdition(editionId);
      if (!data) return buildNotFoundMetadata('Edition');

      const firstPage = data.pages?.[0];

      return buildOgMetadata({
        title: data.edition.title,
        description: data.edition.seo_meta_description || data.edition.description,
        image: ogImageUrl(firstPage?.image_url),
        url: `/epaper/view/${editionId}`,
        type: 'article',
        publishedTime: data.edition.date,
      });
    },
    buildNotFoundMetadata('Edition'),
    `edition-metadata-${params.editionId}`
  );
}

export default async function EpaperViewerPage({ 
  params 
}: { 
  params: { editionId: string } 
}) {
  const editionId = parseInt(params.editionId);

  // Fetch data on server with Next.js caching
  const data = await getCompleteEdition(editionId);

  if (!data) {
    notFound();
  }

  return (
    <div className="bg-gray-50" style={{ minHeight: 'auto' }}>
      {/* Preload first page image — browser fetches it in parallel with JS bundle */}
      {data.pages?.[0]?.image_url && (
        <link rel="preload" as="image" href={data.pages[0].image_url} />
      )}
      <ArticleJsonLd
        title={data.edition.title}
        description={data.edition.seo_meta_description || data.edition.description || undefined}
        image={data.pages?.[0]?.image_url}
        url={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/epaper/view/${editionId}`}
        datePublished={data.edition.date}
      />
      <AnalyticsTracker editionId={editionId} />
      <StaticEpaperLayout
        editionId={params.editionId}
        initialData={data}
      />
    </div>
  );
}
