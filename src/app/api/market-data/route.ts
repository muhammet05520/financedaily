import { NextResponse } from 'next/server';

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

    return NextResponse.json({
      data: stockResults.filter(Boolean),
      commodities: commodityResults.filter(Boolean),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ data: [], commodities: [], error: 'Failed to fetch' }, { status: 500 });
  }
}
