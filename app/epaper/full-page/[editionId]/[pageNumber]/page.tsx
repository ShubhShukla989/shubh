import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { buildOgMetadata, buildNotFoundMetadata, safeMetadata, ogImageUrl } from '@/lib/metadata';
import FullPageViewer from './FullPageViewer';

export const revalidate = 300;

async function getEditionPage(editionId: number, pageNumber: number) {
  try {
    const [edition] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition) return null;

    const [page] = await db
      .select()
      .from(edition_pages)
      .where(and(eq(edition_pages.edition_id, editionId), eq(edition_pages.page_number, pageNumber)))
      .limit(1);
    if (!page) return null;

    return { edition, page };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { editionId: string; pageNumber: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const editionId = parseInt(params.editionId);
      const pageNumber = parseInt(params.pageNumber);
      if (isNaN(editionId) || isNaN(pageNumber)) return buildNotFoundMetadata('Page');

      const data = await getEditionPage(editionId, pageNumber);
      if (!data) return buildNotFoundMetadata('Page');

      const dateStr = data.edition.date
        ? new Date(data.edition.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      const ogTitle = `${data.edition.title}${dateStr ? ` - ${dateStr}` : ''} - Page ${pageNumber}`;

      return buildOgMetadata({
        title: ogTitle,
        description: `View page ${pageNumber} of ${data.edition.title}${dateStr ? ` - ${dateStr}` : ''}`,
        image: ogImageUrl(data.page.image_url),
        url: `/epaper/full-page/${params.editionId}/${params.pageNumber}`,
        type: 'article',
        publishedTime: data.edition.date,
      });
    },
    buildNotFoundMetadata('Page'),
    `full-page-metadata-${params.editionId}-${params.pageNumber}`
  );
}

export default async function FullPagePage({
  params,
}: {
  params: { editionId: string; pageNumber: string };
}) {
  const editionId = parseInt(params.editionId);
  const pageNumber = parseInt(params.pageNumber);
  if (isNaN(editionId) || isNaN(pageNumber)) notFound();

  const data = await getEditionPage(editionId, pageNumber);
  if (!data) notFound();

  return (
    <FullPageViewer
      pageData={{
        page_number: data.page.page_number,
        image_url: data.page.image_url,
        edition: { id: data.edition.id, title: data.edition.title, date: data.edition.date },
      }}
    />
  );
}
