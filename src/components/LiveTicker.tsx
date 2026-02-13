'use client';

import { useState, useEffect } from 'react';

interface MarketData {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

const SYMBOLS = [
  { id: '^GSPC', label: 'S&P 500' },
  { id: '^IXIC', label: 'NASDAQ' },
  { id: '^DJI', label: 'DOW' },
];

const CRYPTO_IDS = 'bitcoin,ethereum';

export default function LiveTicker() {
  const [markets, setMarkets] = useState<MarketData[]>([
    { symbol: 'S&P 500', price: '---', change: '0.00%', up: true },
    { symbol: 'NASDAQ', price: '---', change: '0.00%', up: true },
    { symbol: 'DOW', price: '---', change: '0.00%', up: true },
    { symbol: 'BTC', price: '---', change: '0.00%', up: true },
    { symbol: 'ETH', price: '---', change: '0.00%', up: true },
    { symbol: 'GOLD', price: '---', change: '0.00%', up: true },
    { symbol: 'OIL', price: '---', change: '0.00%', up: true },
  ]);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchPrices = async () => {
    try {
      // Fetch crypto from CoinGecko (free, no key needed)
      const cryptoRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
      );
      const cryptoData = await cryptoRes.json();

      // Fetch stocks/commodities from our API route
      const stockRes = await fetch('/api/market-data');
      const stockData = await stockRes.json();

      const newMarkets: MarketData[] = [];

      // Stock data from our API
      if (stockData.data) {
        for (const item of stockData.data) {
          newMarkets.push({
            symbol: item.symbol,
            price: item.price,
            change: item.change,
            up: item.up,
          });
        }
      }

      // Bitcoin
      if (cryptoData.bitcoin) {
        const btcPrice = cryptoData.bitcoin.usd;
        const btcChange = cryptoData.bitcoin.usd_24h_change || 0;
        newMarkets.push({
          symbol: 'BTC',
          price: `$${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`,
          up: btcChange >= 0,
        });
      }

      // Ethereum
      if (cryptoData.ethereum) {
        const ethPrice = cryptoData.ethereum.usd;
        const ethChange = cryptoData.ethereum.usd_24h_change || 0;
        newMarkets.push({
          symbol: 'ETH',
          price: `$${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          change: `${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(2)}%`,
          up: ethChange >= 0,
        });
      }

      // Add gold and oil from stock data if available
      if (stockData.commodities) {
        for (const item of stockData.commodities) {
          newMarkets.push({
            symbol: item.symbol,
            price: item.price,
            change: item.change,
            up: item.up,
          });
        }
      }

      if (newMarkets.length > 0) {
        setMarkets(newMarkets);
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 2000); // 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-8 text-xs">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
            {markets.map((m, i) => (
              <div key={m.symbol} className={`flex items-center gap-1.5 whitespace-nowrap ${i >= 5 ? 'hidden lg:flex' : i >= 4 ? 'hidden md:flex' : i >= 3 ? 'hidden sm:flex' : ''}`}>
                <span className="font-medium text-gray-300">{m.symbol}</span>
                <span className="text-white">{m.price}</span>
                <span className={m.up ? 'text-green-400' : 'text-red-400'}>
                  {m.up ? '▲' : '▼'} {m.change}
                </span>
              </div>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3 text-gray-400 shrink-0">
            {lastUpdate && <span className="text-2xs">Live</span>}
            <span className="hidden lg:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
