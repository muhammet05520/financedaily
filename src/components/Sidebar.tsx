'use client';

import { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';

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



      {/* Market Summary - Live Data */}
      <LiveMarketSummary />
    </aside>
  );
}

function LiveMarketSummary() {
  const [markets, setMarkets] = useState<{ name: string; price: string; change: string; up: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Single API call - server handles Binance crypto + Yahoo stocks
        const res = await fetch('/api/market-data');
        const data = await res.json();

        const items: { name: string; price: string; change: string; up: boolean }[] = [];

        // Stocks
        if (data.data) {
          for (const item of data.data) {
            items.push({ name: item.symbol, price: item.price, change: item.change, up: item.up });
          }
        }

        // Crypto from Binance (via server)
        if (data.crypto) {
          const cryptoLabels: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana' };
          for (const item of data.crypto) {
            items.push({
              name: cryptoLabels[item.symbol] || item.symbol,
              price: item.price,
              change: item.change,
              up: item.up,
            });
          }
        }

        // Commodities
        if (data.commodities) {
          for (const item of data.commodities) {
            items.push({ name: item.symbol === 'GOLD' ? 'Gold' : 'Crude Oil', price: item.price, change: item.change, up: item.up });
          }
        }

        setMarkets(items);
      } catch (e) {
        console.error('Market data error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-5 bg-primary-600 rounded-full" />
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Market Summary</h3>
        <span className="ml-auto text-2xs text-green-500 font-medium">● LIVE</span>
      </div>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-20" />
              <div className="flex gap-2">
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-12" />
              </div>
            </div>
          ))
        ) : (
          markets.map((m) => (
            <div key={m.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-gray-700">{m.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 font-medium">{m.price}</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  m.up ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                }`}>
                  {m.change}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-2xs text-gray-400 mt-3">Crypto: Binance (real-time) · Stocks: Yahoo Finance</p>
    </div>
  );
}
