import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FinanceDaily Privacy Policy — how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="prose prose-lg max-w-none text-gray-600">
        <h2>Information We Collect</h2>
        <p>When you visit FinanceDaily, we may collect certain information automatically, including your IP address, browser type, operating system, referring URLs, and information about how you interact with our website.</p>
        <p>If you subscribe to our newsletter, we collect your email address. We do not sell or share your email address with third parties.</p>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide and improve our services</li>
          <li>To send you our newsletter (if you subscribed)</li>
          <li>To analyze website traffic and usage patterns</li>
          <li>To display relevant advertisements through Google AdSense</li>
        </ul>

        <h2>Cookies and Advertising</h2>
        <p>We use cookies and similar technologies to enhance your browsing experience. Third-party advertisers, including Google AdSense, may use cookies to serve ads based on your prior visits to this website or other websites.</p>
        <p>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>

        <h2>Third-Party Services</h2>
        <p>We may use third-party services such as Google Analytics to monitor and analyze web traffic. These services may collect information sent by your browser as part of a web page request.</p>

        <h2>Data Security</h2>
        <p>We implement reasonable security measures to protect your personal information. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal information. You can unsubscribe from our newsletter at any time by clicking the unsubscribe link in any email.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@financedaily.com">privacy@financedaily.com</a>.</p>
      </div>
    </div>
  );
}
