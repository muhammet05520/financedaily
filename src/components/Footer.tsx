'use client';

import Link from 'next/link';

const categories = [
  { name: 'Markets', slug: 'markets' },
  { name: 'Cryptocurrency', slug: 'cryptocurrency' },
  { name: 'Economy', slug: 'economy' },
  { name: 'Personal Finance', slug: 'personal-finance' },
  { name: 'Investing', slug: 'investing' },
  { name: 'Real Estate', slug: 'real-estate' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Commodities', slug: 'commodities' },
];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">Finance</span>
                <span className="text-lg font-bold text-primary-400">Daily</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your trusted source for financial news, market analysis, and investment insights. Stay informed, make smarter decisions.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <SocialIcon href="#" label="Twitter">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </SocialIcon>
              <SocialIcon href="#" label="LinkedIn">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </SocialIcon>
              <SocialIcon href="#" label="Facebook">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </SocialIcon>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-gray-400 hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="/sitemap.xml" className="text-sm text-gray-400 hover:text-white transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Daily Newsletter</h3>
            <p className="text-sm text-gray-400 mb-4">
              Get the latest financial news delivered to your inbox every morning.
            </p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-primary-800 border border-primary-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-500 transition-colors"
              >
                Subscribe Free
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> FinanceDaily provides news and information for educational purposes only. 
            The content on this site should not be considered as financial advice. Always consult with a qualified 
            financial advisor before making investment decisions. Past performance does not guarantee future results.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} FinanceDaily. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Market data may be delayed. See terms for details.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  );
}
