import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { epaper_clips, editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { buildOgMetadata, buildNotFoundMetadata, safeMetadata, ogImageUrl } from '@/lib/metadata';
import { ArticleJsonLd } from '@/components/JsonLd';
import ClipViewer from './ClipViewer';

export const revalidate = 3600;

async function getClipWithEdition(clipId: string) {
  try {
    const id = parseInt(clipId);
    if (isNaN(id)) return null;

    const [clip] = await db.select().from(epaper_clips).where(eq(epaper_clips.id, id)).limit(1);
    if (!clip) return null;

    const [edition] = await db.select().from(editions).where(eq(editions.id, clip.edition_id)).limit(1);

    return { ...clip, edition: edition || undefined };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { clipId: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const clip = await getClipWithEdition(params.clipId);
      if (!clip) return buildNotFoundMetadata('Clip');

      const dateStr = clip.edition?.date
        ? new Date(clip.edition.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      const editionTitle = clip.edition?.title || 'Edition';
      const ogTitle = `${editionTitle}${dateStr ? ` - ${dateStr}` : ''} - Page ${clip.page_number}`;

      return buildOgMetadata({
        title: ogTitle,
        description: `Clip from ${editionTitle}${dateStr ? ` dated ${dateStr}` : ''}, Page ${clip.page_number}`,
        image: ogImageUrl(clip.image_url),
        url: `/epaper/clip/${params.clipId}`,
        type: 'article',
        publishedTime: clip.edition?.date,
      });
    },
    buildNotFoundMetadata('Clip'),
    `clip-metadata-${params.clipId}`
  );
}

export default async function ClipPage({ params }: { params: { clipId: string } }) {
  const clip = await getClipWithEdition(params.clipId);
  if (!clip) notFound();

  return (
    <>
      <ArticleJsonLd
        title={`Clip from ${clip.edition?.title || 'Edition'} — Page ${clip.page_number}`}
        description={`View this clipping from ${clip.edition?.title || 'edition'} dated ${clip.edition?.date || ''}`}
        image={clip.clip_url || clip.image_url || undefined}
        url={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/epaper/clip/${params.clipId}`}
        datePublished={clip.edition?.date}
      />
      <ClipViewer clip={clip} />
    </>
  );
}
