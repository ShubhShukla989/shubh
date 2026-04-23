interface ArticleJsonLdProps {
  title: string;
  description?: string;
  image?: string;
  url: string;
  datePublished?: string;
}

export function ArticleJsonLd({ title, description, image, url, datePublished }: ArticleJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: image ? [image] : [],
    url,
    datePublished,
    publisher: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'Epaper',
      url: process.env.NEXT_PUBLIC_SITE_URL || '',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
