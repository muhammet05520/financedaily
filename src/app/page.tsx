import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import Sidebar from '@/components/Sidebar';
import NewsletterSignup from '@/components/NewsletterSignup';
import { LeaderboardAd, InArticleAd } from '@/components/AdUnit';
import { getArticles, getTrendingArticles, getCategories } from '@/lib/db';
import type { Article, Category } from '@/types';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const allArticles = getArticles({ limit: 20 }) as Article[];
  const trendingArticles = getTrendingArticles(5) as Article[];
  const categories = getCategories() as Category[];
  
  // Use latest articles as featured (first 3)
  const featuredArticles = allArticles.slice(0, 3);
  const mainFeatured = featuredArticles[0];
  const secondaryFeatured = featuredArticles.slice(1, 3);
  const latestArticles = allArticles.slice(3, 12);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main featured */}
          <div className="lg:col-span-2">
            {mainFeatured ? (
              <ArticleCard article={mainFeatured} variant="featured" />
            ) : (
              <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-primary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-primary-400 font-medium">Featured articles will appear here</p>
                  <p className="text-primary-300 text-sm mt-1">Run the automation tool to generate content</p>
                </div>
              </div>
            )}
          </div>

          {/* Secondary featured */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {secondaryFeatured.length > 0 ? (
              secondaryFeatured.map((article) => (
                <ArticleCard key={article.id} article={article} variant="horizontal" />
              ))
            ) : (
              <>
                <ArticlePlaceholder />
                <ArticlePlaceholder />
              </>
            )}
            
            {/* Quick links to categories */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Explore Topics</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    {cat.icon} {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Ad */}
      <div className="max-w-7xl mx-auto px-4">
        <LeaderboardAd />
      </div>

      {/* Latest News + Sidebar */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-primary-600 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
          </div>
          <Link href="/category/markets" className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles.slice(0, 4).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* In-content ad */}
            <InArticleAd className="my-6" />

            {/* More articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles.slice(4, 8).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar trendingArticles={trendingArticles} />
          </div>
        </div>
      </section>

      {/* Category Sections */}
      {categories.slice(0, 4).map((category) => {
        const categoryArticles = allArticles.filter(
          (a) => a.category_slug === category.slug
        ).slice(0, 4);

        if (categoryArticles.length === 0) return null;

        return (
          <section key={category.slug} className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {category.article_count} articles
                </span>
              </div>
              <Link
                href={`/category/${category.slug}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
              >
                More {category.name} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categoryArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Another ad section between categories and newsletter */}
      <div className="max-w-7xl mx-auto px-4">
        <LeaderboardAd />
      </div>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <NewsletterSignup />
      </section>

      {/* Bottom content section with more articles */}
      {latestArticles.length > 8 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-7 bg-accent-gold rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">More Stories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.slice(8).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArticlePlaceholder() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
      <div className="shrink-0 w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-full mb-1" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-50 rounded w-24" />
      </div>
    </div>
  );
}
