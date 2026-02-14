import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ArticleCard';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';

import { getArticles, getCategoryBySlug, getCategories, getTrendingArticles } from '@/lib/db';
import type { Article, Category } from '@/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug) as Category | undefined;
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} News & Analysis`,
    description: category.description || `Latest ${category.name} news, analysis, and insights from FinanceDaily.`,
    openGraph: {
      title: `${category.name} — FinanceDaily`,
      description: category.description || `Latest ${category.name} news and analysis.`,
    },
  };
}

export async function generateStaticParams() {
  try {
    const categories = getCategories() as Category[];
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default function CategoryPage({ params }: PageProps) {
  const category = getCategoryBySlug(params.slug) as Category | undefined;
  
  if (!category) {
    notFound();
  }

  const articles = getArticles({ categorySlug: params.slug, limit: 100 }) as Article[];
  const trendingArticles = getTrendingArticles(5) as Article[];
  
  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  const restArticles = articles.filter(a => a.id !== featuredArticle?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: category.name }]} />

      {/* Category header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{category.icon}</span>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        </div>
        <p className="text-gray-500 max-w-2xl">{category.description}</p>
      </div>

      {/* Featured article for category */}
      {featuredArticle && (
        <div className="mb-8">
          <ArticleCard article={featuredArticle} variant="featured" />
        </div>
      )}



      {/* Articles grid + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {restArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {restArticles.slice(0, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {restArticles.length > 4 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restArticles.slice(4, 8).map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </>
              )}

              {restArticles.length > 8 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restArticles.slice(8).map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-400 mb-1">No articles yet</h3>
              <p className="text-sm text-gray-300">Articles in {category.name} will appear here.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar trendingArticles={trendingArticles} />
        </div>
      </div>
    </div>
  );
}
