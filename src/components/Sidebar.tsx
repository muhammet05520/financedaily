'use client';

import ArticleCard from './ArticleCard';
import { SidebarAd } from './AdUnit';
import type { Article } from '@/types';

interface SidebarProps {
  trendingArticles: Article[];
}

export default function Sidebar({ trendingArticles }: SidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Trending Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-5 bg-accent-red rounded-full" />
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Trending Now</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {trendingArticles.map((article, index) => (
            <div key={article.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="text-2xl font-bold text-primary-200 leading-none mt-0.5">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ArticleCard article={article} variant="compact" />
            </div>
          ))}
        </div>
      </div>

      {/* Ad slot */}
      <SidebarAd />

      {/* Newsletter mini */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-5 text-white">
        <h3 className="font-bold text-lg mb-2">📧 Daily Briefing</h3>
        <p className="text-sm text-primary-200 mb-4">
          Get the top 5 financial stories delivered to your inbox every morning.
        </p>
        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            className="w-full px-3 py-2 bg-white text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            Subscribe Free →
          </button>
        </form>
      </div>

      {/* Second ad slot */}
      <SidebarAd />

      {/* Market Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-5 bg-primary-600 rounded-full" />
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Market Summary</h3>
        </div>
        <div className="space-y-3">
          <MarketRow name="S&P 500" value="5,234.18" change="+0.85%" up={true} />
          <MarketRow name="NASDAQ" value="16,742.39" change="+1.12%" up={true} />
          <MarketRow name="DOW 30" value="39,142.67" change="-0.23%" up={false} />
          <MarketRow name="Bitcoin" value="$101,234" change="+2.45%" up={true} />
          <MarketRow name="Gold" value="$2,089.50" change="+0.34%" up={true} />
          <MarketRow name="Crude Oil" value="$78.42" change="-1.12%" up={false} />
        </div>
        <p className="text-2xs text-gray-400 mt-3">Data may be delayed. See disclaimer.</p>
      </div>
    </aside>
  );
}

function MarketRow({ name, value, change, up }: { name: string; value: string; change: string; up: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm font-medium text-gray-700">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900 font-medium">{value}</span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
          up ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        }`}>
          {change}
        </span>
      </div>
    </div>
  );
}
