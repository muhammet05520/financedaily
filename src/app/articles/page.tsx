import Link from 'next/link';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ArticleCard';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';

import { getArticles, getArticleCount, getTrendingArticles, getCategories } from '@/lib/db';
import type { Article, Category } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Articles — FinanceDaily',
  description: 'Browse all financial news, analysis, and market insights from FinanceDaily.',
};

export default function ArticlesPage() {
  const articles = getArticles({ limit: 500 }) as Article[];
  const trendingArticles = getTrendingArticles(5) as Article[];
  const categories = getCategories() as Category[];
  const totalCount = getArticleCount();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'All Articles' }]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Articles</h1>
        <p className="text-gray-500">
          {totalCount} articles covering markets, crypto, economy, and more.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-full">
          All ({totalCount})
        </span>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            {cat.icon} {cat.name} ({cat.article_count})
          </Link>
        ))}
      </div>

      {/* Articles grid + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Sidebar trendingArticles={trendingArticles} />
          </div>
        </div>
      </div>
    </div>
  );
}
