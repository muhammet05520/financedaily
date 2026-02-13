import { NextResponse } from 'next/server';

// Server-side cache
let cachedData: any = null;
let lastFetch = 0;
const CACHE_TTL = 3000; // 3 second cache

// Fallback when API completely fails and no cache
const FALLBACK_DATA = {
  data: [],
  commodities: [],
  crypto: [],
  timestamp: new Date().toISOString(),
  fallback: true,
};

// --- Yahoo Finance for stocks & commodities ---
async function fetchYahoo(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
      { next: { revalidate: 10 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    if (!currentPrice || !previousClose) return null;

    const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
    return { price: currentPrice, change: changePercent };
  } catch {
    return null;
  }
}

// --- Binance API for real-time crypto ---
async function fetchBinanceCrypto(): Promise<any[]> {
  const pairs = [
    { symbol: 'BTCUSDT', label: 'BTC' },
    { symbol: 'ETHUSDT', label: 'ETH' },
    { symbol: 'SOLUSDT', label: 'SOL' },
  ];

  try {
    const results = await Promise.all(
      pairs.map(async (p) => {
        try {
          const res = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${p.symbol}`,
            { next: { revalidate: 3 } }
          );
          if (!res.ok) return null;
          const data = await res.json();

          const price = parseFloat(data.lastPrice);
          const change = parseFloat(data.priceChangePercent);

          return {
            symbol: p.label,
            price: `$${price.toLocaleString('en-US', { maximumFractionDigits: price > 100 ? 0 : 2 })}`,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            up: change >= 0,
          };
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Return cached if fresh
    const now = Date.now();
    if (cachedData && now - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedData);
    }

    const stockSymbols = [
      { id: '^GSPC', label: 'S&P 500' },
      { id: '^IXIC', label: 'NASDAQ' },
      { id: '^DJI', label: 'DOW' },
    ];

    const commoditySymbols = [
      { id: 'GC=F', label: 'GOLD' },
      { id: 'CL=F', label: 'OIL' },
    ];

    // Fetch stocks, commodities, AND crypto all in parallel
    const [stockResults, commodityResults, cryptoResults] = await Promise.all([
      Promise.all(stockSymbols.map(async (s) => {
        const result = await fetchYahoo(s.id);
        if (!result) return null;
        return {
          symbol: s.label,
          price: result.price.toLocaleString('en-US', { maximumFractionDigits: 2 }),
          change: `${result.change >= 0 ? '+' : ''}${result.change.toFixed(2)}%`,
          up: result.change >= 0,
        };
      })),
      Promise.all(commoditySymbols.map(async (s) => {
        const result = await fetchYahoo(s.id);
        if (!result) return null;
        return {
          symbol: s.label,
          price: `$${result.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
          change: `${result.change >= 0 ? '+' : ''}${result.change.toFixed(2)}%`,
          up: result.change >= 0,
        };
      })),
      fetchBinanceCrypto(),
    ]);

    const result = {
      data: stockResults.filter(Boolean),
      commodities: commodityResults.filter(Boolean),
      crypto: cryptoResults,
      timestamp: new Date().toISOString(),
      source: 'binance+yahoo',
    };

    // Cache it
    cachedData = result;
    lastFetch = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    return NextResponse.json(FALLBACK_DATA);
  }
}
