import type { Metadata } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DisclaimerConsent from '@/components/DisclaimerConsent';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FinanceDaily — Breaking Financial News, Stock Market & Crypto Analysis',
    template: '%s | FinanceDaily',
  },
  description: 'Get the latest breaking financial news, real-time stock market data, cryptocurrency price analysis, investment strategies, and expert economic insights. Updated every 2 hours with AI-powered analysis.',
  keywords: [
    'financial news', 'stock market news', 'investing', 'cryptocurrency news',
    'economy', 'personal finance', 'market analysis', 'bitcoin price',
    'stock market today', 'breaking financial news', 'investment insights',
    'crypto market', 'S&P 500', 'NASDAQ', 'Wall Street', 'forex',
    'interest rates', 'Federal Reserve', 'earnings reports',
  ],
  authors: [{ name: 'FinanceDaily Team' }],
  creator: 'FinanceDaily',
  publisher: 'FinanceDaily',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.SITE_URL || 'https://financedailyus.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'FinanceDaily',
    title: 'FinanceDaily — Breaking Financial News, Stock Market & Crypto Analysis',
    description: 'Get the latest breaking financial news, real-time stock market data, cryptocurrency analysis, and expert investment insights. Updated every 2 hours.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FinanceDaily - Financial News & Market Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanceDaily — Breaking Financial News & Market Analysis',
    description: 'Real-time stock market data, crypto analysis, and expert investment insights. Updated every 2 hours.',
    images: ['/og-image.png'],
    creator: '@financedaily',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'finance',
  other: {
    'google-site-verification': '',
    'msvalidate.01': '',
    'news_keywords': 'financial news, stock market, cryptocurrency, investing, economy',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-title" content="FinanceDaily" />
        <meta name="application-name" content="FinanceDaily" />
        <meta name="msapplication-TileColor" content="#2563eb" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://api.binance.com" />
        
        {/* AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1068181276022573"
          crossOrigin="anonymous"
        />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-4VBJ56VFMB"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4VBJ56VFMB');`,
          }}
        />

        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'FinanceDaily',
              url: 'https://financedailyus.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://financedailyus.com/logo.png',
                width: 512,
                height: 512,
              },
              sameAs: [],
              description: 'Your trusted source for breaking financial news, stock market analysis, cryptocurrency updates, and expert investment insights. Updated every 2 hours.',
              foundingDate: '2025',
              publishingPrinciples: 'https://financedailyus.com/about',
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <DisclaimerConsent />
      </body>
    </html>
  );
}
