'use client';

import { useEffect } from 'react';

interface AdUnitProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle' | 'responsive' | 'leaderboard';
  className?: string;
  label?: boolean;
}

export default function AdUnit({ slot, format = 'responsive', className = '', label = true }: AdUnitProps) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-1068181276022573';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense not loaded
    }
  }, []);

  const sizeStyles: Record<string, string> = {
    horizontal: 'min-h-[90px] w-full',
    vertical: 'min-h-[600px] w-[160px]',
    rectangle: 'min-h-[250px] w-full max-w-[336px]',
    responsive: 'min-h-[100px] w-full',
    leaderboard: 'min-h-[90px] w-full max-w-[728px] mx-auto',
  };

  // Show placeholder when no AdSense ID is configured
  const isPlaceholder = !adsenseId || adsenseId === 'ca-pub-XXXXXXXXXXXXXXXX';

  return (
    <div className={`ad-container ${className}`}>
      {label && (
        <span className="block text-2xs text-gray-400 uppercase tracking-wider mb-1 text-center">
          Advertisement
        </span>
      )}
      <div className={`${sizeStyles[format]} bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden`}>
        {isPlaceholder ? (
          <div className="text-center p-4">
            <div className="text-gray-300 text-sm font-medium">Ad Space</div>
            <div className="text-gray-300 text-xs mt-1">{format}</div>
          </div>
        ) : (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={adsenseId}
            data-ad-slot={slot || ''}
            data-ad-format={format === 'responsive' ? 'auto' : undefined}
            data-full-width-responsive={format === 'responsive' ? 'true' : undefined}
          />
        )}
      </div>
    </div>
  );
}

// In-article ad that appears between content sections
export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdUnit format="responsive" label={true} />
    </div>
  );
}

// Sidebar ad
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`sticky top-24 ${className}`}>
      <AdUnit format="rectangle" label={true} />
    </div>
  );
}

// Leaderboard banner ad
export function LeaderboardAd({ className = '' }: { className?: string }) {
  return (
    <div className={`py-3 ${className}`}>
      <AdUnit format="leaderboard" label={true} />
    </div>
  );
}
