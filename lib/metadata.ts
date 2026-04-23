import { logger } from './logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Epaper';
const DEFAULT_OG = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '';

// Wraps an image URL through the OG crop API (1200x630 landscape)
export function ogImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const base = SITE_URL || '';
  return `${base}/api/og-image?url=${encodeURIComponent(imageUrl)}`;
}

export function buildOgMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  publishedTime,
  author,
}: {
  title: string;
  description?: string | null;
  image?: string | null;
  url: string;
  type?: 'website' | 'article';
  keywords?: string | null;
  publishedTime?: string | null;
  author?: string | null;
}) {
  const ogImage = image || DEFAULT_OG || undefined;
  const desc = description ? description.slice(0, 160) : undefined;
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  // Strip query params and trailing slashes from canonical
  const canonical = fullUrl.split('?')[0].replace(/\/$/, '') || fullUrl;

  return {
    title,
    description: desc,
    keywords: keywords || undefined,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description: desc,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : [],
      url: canonical,
      type,
      siteName: SITE_NAME,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description: desc,
      images: ogImage ? [ogImage] : [],
    },
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export function buildNotFoundMetadata(label: string) {
  return {
    title: `${label} Not Found`,
    robots: { index: false, follow: false },
  };
}

// Wraps any metadata fetch — catches errors, logs them, returns fallback
// Metadata generation must never throw — a crash here fails the entire page render
export async function safeMetadata<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Metadata fetch failed: ${context}`, error as Error, { context });
    return fallback;
  }
}
