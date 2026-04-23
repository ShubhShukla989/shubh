import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { area_maps, editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { buildOgMetadata, buildNotFoundMetadata, safeMetadata, ogImageUrl } from '@/lib/metadata';
import AreaMapViewer from './AreaMapViewer';

export const revalidate = 180;

async function getAreaMapWithEdition(areaMapId: string) {
  try {
    const id = parseInt(areaMapId);
    if (isNaN(id)) return null;

    const [areaMap] = await db.select().from(area_maps).where(eq(area_maps.id, id)).limit(1);
    if (!areaMap) return null;

    const edition = areaMap.edition_id
      ? (await db.select().from(editions).where(eq(editions.id, areaMap.edition_id)).limit(1))[0]
      : undefined;

    return { ...areaMap, edition: edition || undefined };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { areaMapId: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const areaMap = await getAreaMapWithEdition(params.areaMapId);
      if (!areaMap) return buildNotFoundMetadata('Area Map');

      const dateStr = areaMap.edition?.date
        ? new Date(areaMap.edition.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      const editionTitle = areaMap.edition?.title || 'Edition';
      const ogTitle = `${editionTitle}${dateStr ? ` - ${dateStr}` : ''}`;

      return buildOgMetadata({
        title: ogTitle,
        description: areaMap.content?.slice(0, 160) || `Area map from ${editionTitle}`,
        image: ogImageUrl(areaMap.watermarked_image_url || areaMap.combined_image_url),
        url: `/epaper/area-map/${params.areaMapId}`,
        type: 'article',
        publishedTime: areaMap.edition?.date,
      });
    },
    buildNotFoundMetadata('Area Map'),
    `area-map-metadata-${params.areaMapId}`
  );
}

export default async function AreaMapPage({ params }: { params: { areaMapId: string } }) {
  const areaMap = await getAreaMapWithEdition(params.areaMapId);
  if (!areaMap) notFound();

  const baseUrl = areaMap.combined_image_url || areaMap.watermarked_image_url;
  if (!baseUrl) notFound();

  const version = areaMap.watermark_version ? `?v=${encodeURIComponent(areaMap.watermark_version)}` : '';
  const imageUrl = baseUrl + version;

  return <AreaMapViewer areaMap={areaMap} imageUrl={imageUrl} />;
}
