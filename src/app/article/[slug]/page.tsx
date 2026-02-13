import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleCard from '@/components/ArticleCard';
import ArticleImage from '@/components/ArticleImage';
import { getArticleBySlug, getRelatedArticles, getTrendingArticles, getAllSlugs } from '@/lib/db';
import { formatDate, timeAgo } from '@/lib/utils';
import type { Article, Comment } from '@/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = getArticleBySlug(params.slug) as Article | undefined;
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    keywords: article.meta_keywords?.split(',').map((k: string) => k.trim()),
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.created_at,
      modifiedTime: article.updated_at,
      authors: [article.author],
      images: article.featured_image ? [{ url: article.featured_image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = getAllSlugs();
    return slugs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export default function ArticlePage({ params }: PageProps) {
  const article = getArticleBySlug(params.slug) as Article | undefined;

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.id, article.category_id, 4) as Article[];
  const trendingArticles = getTrendingArticles(5) as Article[];

  // Insert ads into content
  const contentWithAds = insertAdsIntoContent(article.content);

  // JSON-LD Article schema
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.featured_image || undefined,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FinanceDaily',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.SITE_URL || ''}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.SITE_URL || ''}/article/${article.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: article.category_name || 'Articles', href: `/category/${article.category_slug}` },
            { label: article.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <article className="lg:col-span-2">
            {/* Category & meta */}
            <div className="flex items-center gap-3 mb-4">
              {article.category_name && (
                <Link
                  href={`/category/${article.category_slug}`}
                  className={`px-3 py-1 text-xs font-semibold rounded-full badge-${article.category_slug}`}
                >
                  {article.category_name}
                </Link>
              )}
              <span className="text-xs text-gray-400">{timeAgo(article.created_at)}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4 text-balance">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg text-gray-500 leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Author & date bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 border-y border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-700">
                    {article.author?.charAt(0) || 'F'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{article.author}</p>
                  <p className="text-xs text-gray-400">{formatDate(article.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {article.reading_time} min read
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.views?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Featured image */}
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <ArticleImage
                src={article.featured_image}
                alt={article.title}
                categoryId={article.category_id}
                categoryName={article.category_name}
                className="w-full h-full"
                iconSize="lg"
              />
            </div>

            {/* Article content with embedded ads */}
            <div
              className="article-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: contentWithAds }}
            />



            {/* Share buttons */}
            <div className="flex items-center gap-3 py-6 border-t border-gray-100 mt-8">
              <span className="text-sm font-medium text-gray-500">Share:</span>
              <ShareButton platform="twitter" article={article} />
              <ShareButton platform="facebook" article={article} />
              <ShareButton platform="linkedin" article={article} />
              <ShareButton platform="copy" article={article} />
            </div>

            {/* Tags */}
            {article.meta_keywords && (
              <div className="flex flex-wrap gap-2 py-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 mr-2">Tags:</span>
                {article.meta_keywords.split(',').map((tag: string) => (
                  <span
                    key={tag.trim()}
                    className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Comments Section */}
            {article.comments && article.comments.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-7 bg-primary-600 rounded-full" />
                  <h2 className="text-xl font-bold text-gray-900">Comments ({article.comments.length})</h2>
                </div>
                <div className="space-y-4">
                  {article.comments.map((comment: Comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: comment.avatar_color || '#3b82f6' }}
                        >
                          {comment.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{comment.name}</p>
                          <p className="text-xs text-gray-400">{timeAgo(comment.date)}</p>
                        </div>
                        {comment.likes > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            {comment.likes}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pl-12">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-7 bg-primary-600 rounded-full" />
                  <h2 className="text-xl font-bold text-gray-900">Related Articles</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedArticles.map((related) => (
                    <ArticleCard key={related.id} article={related} />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Trending */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 bg-accent-red rounded-full" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Trending</h3>
              </div>
              <div className="space-y-1">
                {trendingArticles.map((trending, index) => (
                  <div key={trending.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-lg font-bold text-primary-200 mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <ArticleCard article={trending} variant="compact" />
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter mini */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2">📧 Get Daily Insights</h3>
              <p className="text-sm text-primary-200 mb-3">Free financial news delivered every morning.</p>
              <form className="space-y-2" action="#" method="POST">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button className="w-full px-3 py-2 bg-white text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-50 transition-colors">
                  Subscribe Free
                </button>
              </form>
            </div>

          </aside>
        </div>
      </div>

    </>
  );
}

function insertAdsIntoContent(content: string): string {
  return content;
}

function ShareButton({ platform, article }: { platform: string; article: Article }) {
  const url = `${process.env.SITE_URL || ''}/article/${article.slug}`;
  const text = encodeURIComponent(article.title);
  
  const links: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${text}`,
    copy: '#',
  };

  const icons: Record<string, string> = {
    twitter: 'X',
    facebook: 'f',
    linkedin: 'in',
    copy: '🔗',
  };

  return (
    <a
      href={links[platform]}
      target={platform !== 'copy' ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-primary-100 hover:text-primary-700 transition-colors"
      aria-label={`Share on ${platform}`}
    >
      {icons[platform]}
    </a>
  );
}
