import Link from 'next/link';
import { formatDate, timeAgo, truncate } from '@/lib/utils';
import type { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact' | 'horizontal';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'featured') return <FeaturedCard article={article} />;
  if (variant === 'compact') return <CompactCard article={article} />;
  if (variant === 'horizontal') return <HorizontalCard article={article} />;

  return (
    <article className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      {/* Image */}
      <Link href={`/article/${article.slug}`} className="block aspect-video bg-gradient-to-br from-primary-100 to-primary-50 relative overflow-hidden">
        {article.featured_image ? (
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Category badge */}
        {article.category_name && (
          <Link
            href={`/category/${article.category_slug}`}
            className="inline-block px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-3 hover:bg-primary-100 transition-colors"
          >
            {article.category_name}
          </Link>
        )}

        {/* Title */}
        <Link href={`/article/${article.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>{timeAgo(article.created_at)}</span>
            <span>·</span>
            <span>{article.reading_time} min read</span>
          </div>
          <span>{article.views?.toLocaleString() || 0} views</span>
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <article className="group relative bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
      
      {article.featured_image ? (
        <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-24 h-24 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      )}

      <div className="relative z-20 p-5 sm:p-8 flex flex-col justify-end min-h-[280px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="flex items-center gap-3 mb-4">
          {article.category_name && (
            <Link
              href={`/category/${article.category_slug}`}
              className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full hover:bg-primary-500 transition-colors"
            >
              {article.category_name}
            </Link>
          )}
          <span className="px-3 py-1 bg-accent-gold text-white text-xs font-semibold rounded-full">FEATURED</span>
        </div>

        <Link href={`/article/${article.slug}`}>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-primary-200 transition-colors">
            {article.title}
          </h1>
        </Link>

        <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed mb-4 max-w-2xl line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
          <span className="font-medium text-gray-300">{article.author}</span>
          <span className="hidden sm:inline">·</span>
          <span>{formatDate(article.created_at)}</span>
          <span>·</span>
          <span>{article.reading_time} min read</span>
        </div>
      </div>
    </article>
  );
}

function CompactCard({ article }: { article: Article }) {
  return (
    <article className="group flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        {article.category_name && (
          <Link
            href={`/category/${article.category_slug}`}
            className="text-2xs font-semibold text-primary-600 uppercase tracking-wider"
          >
            {article.category_name}
          </Link>
        )}
        <Link href={`/article/${article.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug mt-0.5 group-hover:text-primary-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>
        <span className="text-xs text-gray-400 mt-1 block">{timeAgo(article.created_at)}</span>
      </div>
    </article>
  );
}

function HorizontalCard({ article }: { article: Article }) {
  return (
    <article className="group flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
      <Link href={`/article/${article.slug}`} className="shrink-0 w-32 h-24 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg overflow-hidden">
        {article.featured_image ? (
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        {article.category_name && (
          <Link href={`/category/${article.category_slug}`} className="text-2xs font-semibold text-primary-600 uppercase tracking-wider">
            {article.category_name}
          </Link>
        )}
        <Link href={`/article/${article.slug}`}>
          <h3 className="text-sm font-bold text-gray-900 leading-snug mt-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{timeAgo(article.created_at)}</span>
          <span>·</span>
          <span>{article.reading_time} min</span>
        </div>
      </div>
    </article>
  );
}
