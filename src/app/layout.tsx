import type { Metadata } from 'next';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DisclaimerConsent from '@/components/DisclaimerConsent';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FinanceDaily — Financial News, Market Analysis & Investment Insights',
    template: '%s | FinanceDaily',
  },
  description: 'Your trusted source for breaking financial news, stock market analysis, cryptocurrency updates, and expert investment insights. Stay ahead of the markets with FinanceDaily.',
  keywords: ['financial news', 'stock market', 'investing', 'cryptocurrency', 'economy', 'personal finance', 'market analysis'],
  authors: [{ name: 'FinanceDaily Team' }],
  creator: 'FinanceDaily',
  publisher: 'FinanceDaily',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'FinanceDaily',
    title: 'FinanceDaily — Financial News, Market Analysis & Investment Insights',
    description: 'Your trusted source for breaking financial news, stock market analysis, cryptocurrency updates, and expert investment insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FinanceDaily',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanceDaily',
    description: 'Your trusted source for financial news & market analysis',
    images: ['/og-image.png'],
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
  verification: {
    google: 'your-google-verification-code',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1068181276022573"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics placeholder */}
        {/* 
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX" strategy="afterInteractive" />
        <Script id="gtag" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXXX');`}
        </Script>
        */}

        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'FinanceDaily',
              url: process.env.SITE_URL || 'http://localhost:3000',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.SITE_URL || ''}/logo.png`,
              },
              sameAs: [],
              description: 'Your trusted source for financial news, market analysis, and investment insights.',
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
