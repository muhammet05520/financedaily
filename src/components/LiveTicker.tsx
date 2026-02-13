'use client';

import { useState, useEffect, useRef } from 'react';

interface MarketData {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

export default function LiveTicker() {
  const [stockData, setStockData] = useState<MarketData[]>([]);
  const [cryptoData, setCryptoData] = useState<Record<string, MarketData>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [wsLive, setWsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  // Fetch stocks + commodities + crypto fallback from server API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/market-data');
        const data = await res.json();

        const items: MarketData[] = [];

        // Stocks: S&P 500, NASDAQ, DOW
        if (data.data) {
          for (const item of data.data) {
            items.push({ symbol: item.symbol, price: item.price, change: item.change, up: item.up });
          }
        }

        // Commodities: GOLD, OIL
        if (data.commodities) {
          for (const item of data.commodities) {
            items.push({ symbol: item.symbol, price: item.price, change: item.change, up: item.up });
          }
        }

        setStockData(items);

        // Use API crypto data only as initial/fallback (don't overwrite WebSocket data)
        if (data.crypto) {
          setCryptoData(prev => {
            const updated = { ...prev };
            for (const item of data.crypto) {
              if (!updated[item.symbol]) {
                updated[item.symbol] = item;
              }
            }
            return updated;
          });
        }

        setLastUpdate(
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (e) {
        console.error('Market data fetch error:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // stocks refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Binance WebSocket for REAL-TIME crypto (BTC + ETH)
  useEffect(() => {
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(
        'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker'
      );

      ws.onopen = () => {
        setWsLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const { data } = JSON.parse(event.data);
          if (!data) return;

          const symbolMap: Record<string, string> = { BTCUSDT: 'BTC', ETHUSDT: 'ETH' };
          const symbol = symbolMap[data.s];
          if (!symbol) return;

          const price = parseFloat(data.c);
          const changePercent = parseFloat(data.P);

          setCryptoData(prev => ({
            ...prev,
            [symbol]: {
              symbol,
              price: `$${price.toLocaleString('en-US', { maximumFractionDigits: price > 100 ? 0 : 2 })}`,
              change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              up: changePercent >= 0,
            },
          }));

          setLastUpdate(
            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        } catch {}
      };

      ws.onclose = () => {
        setWsLive(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
      }
    };
  }, []);

  // Build final list: S&P 500, NASDAQ, DOW, BTC, ETH, GOLD, OIL
  const stocks = stockData.filter(s => ['S&P 500', 'NASDAQ', 'DOW'].includes(s.symbol));
  const commodities = stockData.filter(s => ['GOLD', 'OIL'].includes(s.symbol));
  const cryptoList = ['BTC', 'ETH'].map(s => cryptoData[s]).filter(Boolean) as MarketData[];
  const markets = [...stocks, ...cryptoList, ...commodities];

  return (
    <div className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-8 text-xs">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
            {markets.length === 0 ? (
              // Loading skeleton
              ['S&P 500', 'NASDAQ', 'DOW', 'BTC', 'ETH', 'GOLD', 'OIL'].map((name, i) => (
                <div key={name} className={`flex items-center gap-1.5 whitespace-nowrap ${i >= 5 ? 'hidden lg:flex' : i >= 4 ? 'hidden md:flex' : i >= 3 ? 'hidden sm:flex' : ''}`}>
                  <span className="font-medium text-gray-300">{name}</span>
                  <span className="text-gray-500 animate-pulse">loading</span>
                </div>
              ))
            ) : (
              markets.map((m, i) => (
                <div key={m.symbol} className={`flex items-center gap-1.5 whitespace-nowrap ${i >= 5 ? 'hidden lg:flex' : i >= 4 ? 'hidden md:flex' : i >= 3 ? 'hidden sm:flex' : ''}`}>
                  <span className="font-medium text-gray-300">{m.symbol}</span>
                  <span className="text-white">{m.price}</span>
                  <span className={m.up ? 'text-green-400' : 'text-red-400'}>
                    {m.up ? '▲' : '▼'} {m.change}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:flex items-center gap-3 text-gray-400 shrink-0">
            {lastUpdate && (
              <span className={`text-2xs font-medium ${wsLive ? 'text-green-400' : 'text-yellow-400'}`}>
                {wsLive ? '● LIVE' : '● UPDATING'}
              </span>
            )}
            <span className="hidden lg:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
