import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about FinanceDaily — your trusted source for financial news, market analysis, and investment insights.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About FinanceDaily</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-500 mb-8 leading-relaxed">
          FinanceDaily is your trusted destination for comprehensive financial news, market analysis, and expert investment insights. We deliver timely, accurate, and actionable information to help you make smarter financial decisions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          Our mission is to democratize financial information by providing high-quality, accessible content to investors and finance enthusiasts worldwide. We believe that everyone deserves access to the insights and analysis that were once reserved for Wall Street professionals.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">What We Cover</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">📈 Markets</h3>
            <p className="text-sm text-gray-600">Stock market news, analysis, and real-time updates</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">₿ Cryptocurrency</h3>
            <p className="text-sm text-gray-600">Bitcoin, Ethereum, and digital asset coverage</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">🌍 Economy</h3>
            <p className="text-sm text-gray-600">Global economic trends and macroeconomic analysis</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">💰 Personal Finance</h3>
            <p className="text-sm text-gray-600">Budgeting, saving, and financial planning guides</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">📊 Investing</h3>
            <p className="text-sm text-gray-600">Investment strategies and portfolio management</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">🛢️ Commodities</h3>
            <p className="text-sm text-gray-600">Gold, oil, and commodity market insights</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Editorial Standards</h2>
        <p className="text-gray-600 leading-relaxed">
          We are committed to accuracy, transparency, and editorial independence. Our team works diligently to verify information before publication and corrects any errors promptly. We clearly distinguish between news reporting and opinion pieces.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Contact Us</h2>
        <p className="text-gray-600 leading-relaxed">
          Have a question, tip, or feedback? We'd love to hear from you. Reach out to us at{' '}
          <a href="mailto:contact@financedaily.com" className="text-primary-600 hover:text-primary-800">
            contact@financedaily.com
          </a>
        </p>
      </div>
    </div>
  );
}
