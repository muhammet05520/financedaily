import { NextResponse } from 'next/server';

// Server-side cache (persists across requests while function is warm)
let cachedData: any = null;
let lastFetch = 0;
const CACHE_TTL = 15000; // 15 seconds cache

// Fallback data shown immediately if no cache exists yet
const FALLBACK_DATA = {
  data: [
    { symbol: 'S&P 500', price: '5,960', change: '+0.12%', up: true },
    { symbol: 'NASDAQ', price: '19,280', change: '+0.08%', up: true },
    { symbol: 'DOW', price: '43,850', change: '+0.15%', up: true },
  ],
  commodities: [
    { symbol: 'GOLD', price: '$2,920', change: '+0.22%', up: true },
    { symbol: 'OIL', price: '$71.50', change: '-0.35%', up: false },
  ],
  timestamp: new Date().toISOString(),
  fallback: true,
};

async function fetchYahoo(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
      { next: { revalidate: 20 } }
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

    // Fetch all in parallel
    const [stockResults, commodityResults] = await Promise.all([
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
    ]);

    const result = {
      data: stockResults.filter(Boolean),
      commodities: commodityResults.filter(Boolean),
      timestamp: new Date().toISOString(),
    };

    // Cache it
    cachedData = result;
    lastFetch = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    // Return cached data if available, otherwise fallback
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    return NextResponse.json(FALLBACK_DATA);
  }
}
