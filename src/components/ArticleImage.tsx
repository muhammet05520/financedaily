'use client';

import { useState, useCallback } from 'react';

// Category-themed gradients + icons
const CATEGORY_THEMES: Record<number | string, { gradient: string; icon: string; label: string }> = {
  1: { gradient: 'from-emerald-600 via-teal-700 to-cyan-800', icon: '📈', label: 'Markets' },
  2: { gradient: 'from-orange-500 via-amber-600 to-yellow-700', icon: '₿', label: 'Crypto' },
  3: { gradient: 'from-blue-600 via-indigo-700 to-violet-800', icon: '🌐', label: 'Economy' },
  4: { gradient: 'from-green-500 via-emerald-600 to-teal-700', icon: '💰', label: 'Finance' },
  5: { gradient: 'from-purple-600 via-fuchsia-700 to-pink-800', icon: '📊', label: 'Investing' },
  6: { gradient: 'from-slate-600 via-gray-700 to-zinc-800', icon: '🏠', label: 'Real Estate' },
  7: { gradient: 'from-cyan-500 via-blue-600 to-indigo-700', icon: '💻', label: 'Technology' },
  8: { gradient: 'from-amber-600 via-orange-700 to-red-800', icon: '🛢️', label: 'Commodities' },
  default: { gradient: 'from-blue-600 via-indigo-700 to-purple-800', icon: '📰', label: 'Finance' },
};

// Known bad image patterns (logos, tracking pixels, placeholders)
const BAD_IMAGE_PATTERNS = [
  'ipboard', 'logo', 'favicon', 'icon', 'avatar', 'badge', 'tracking',
  'pixel', '1x1', 'spacer', 'blank', 'placeholder', 'default',
  'gravatar', 'wp-content/plugins', 'widgets', 'button',
];

function isSuspiciousUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return BAD_IMAGE_PATTERNS.some(pattern => lower.includes(pattern));
}

interface ArticleImageProps {
  src?: string;
  alt: string;
  categoryId?: number;
  categoryName?: string;
  className?: string;
  overlayClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export default function ArticleImage({
  src,
  alt,
  categoryId,
  categoryName,
  className = 'w-full h-full',
  overlayClassName = '',
  iconSize = 'md',
}: ArticleImageProps) {
  const [failed, setFailed] = useState(() => !src || isSuspiciousUrl(src || ''));

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Reject tiny images (likely logos/icons)
    if (img.naturalWidth < 300 || img.naturalHeight < 200) {
      setFailed(true);
    }
  }, []);

  const theme = CATEGORY_THEMES[categoryId || 'default'] || CATEGORY_THEMES.default;
  const sizes = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' };

  if (failed) {
    return (
      <div className={`${className} bg-gradient-to-br ${theme.gradient} flex items-center justify-center relative overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white rounded-full" />
        </div>
        {/* Icon + Category */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className={`${sizes[iconSize]} drop-shadow-lg`}>{theme.icon}</span>
          <span className="text-white/80 text-xs font-semibold tracking-wider uppercase">
            {categoryName || theme.label}
          </span>
        </div>
        {overlayClassName && <div className={overlayClassName} />}
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} object-cover`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
      {overlayClassName && <div className={overlayClassName} />}
    </>
  );
}
