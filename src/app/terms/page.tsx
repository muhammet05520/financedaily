import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'FinanceDaily Terms of Service — rules governing your use of our website.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="prose prose-lg max-w-none text-gray-600">
        <h2>Acceptance of Terms</h2>
        <p>By accessing and using FinanceDaily, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>

        <h2>Content Disclaimer</h2>
        <p><strong>FinanceDaily provides news and information for educational and informational purposes only.</strong> The content on this website should not be construed as financial advice, investment recommendations, or an offer to buy or sell any securities.</p>
        <p>Always consult with a qualified financial advisor before making any investment decisions. Past performance does not guarantee future results. Investing involves risk, including the possible loss of principal.</p>

        <h2>Intellectual Property</h2>
        <p>All content published on FinanceDaily, including articles, graphics, logos, and design elements, is the property of FinanceDaily and is protected by copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>

        <h2>User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use our website for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with the proper functioning of the website</li>
          <li>Scrape or harvest content without permission</li>
          <li>Use automated systems to access the website in a manner that sends more request messages than a human can reasonably produce</li>
        </ul>

        <h2>Limitation of Liability</h2>
        <p>FinanceDaily shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the website or reliance on any information provided.</p>

        <h2>Market Data</h2>
        <p>Market data displayed on FinanceDaily may be delayed and is provided for informational purposes only. We do not guarantee the accuracy, completeness, or timeliness of any market data.</p>

        <h2>Changes to Terms</h2>
        <p>We reserve the right to modify these Terms of Service at any time. Continued use of the website after any modifications indicates your acceptance of the updated terms.</p>

        <h2>Contact</h2>
        <p>For questions about these Terms of Service, contact us at <a href="mailto:legal@financedaily.com">legal@financedaily.com</a>.</p>
      </div>
    </div>
  );
}
