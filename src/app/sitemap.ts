import { getArticles, getCategories } from '@/lib/db';
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL || 'https://financedailyus.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles({ limit: 10000 }) as any[];
  const categories = getCategories() as any[];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/article/${article.slug}`,
    lastModified: new Date(article.updated_at || article.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...categoryEntries,
    ...articleEntries,
  ];
}
