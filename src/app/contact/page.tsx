import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the FinanceDaily team. We welcome your feedback, tips, and inquiries.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
      <p className="text-lg text-gray-500 mb-10 max-w-2xl">
        Have a question, news tip, or feedback? We'd love to hear from you. Fill out the form below or reach out directly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact form */}
        <div className="md:col-span-2">
          <form className="space-y-5" action="#" method="POST">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-600">
                <option>General Inquiry</option>
                <option>News Tip</option>
                <option>Advertising</option>
                <option>Partnership</option>
                <option>Bug Report</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 mb-3">Get in Touch</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <a href="mailto:contact@financedaily.com" className="text-primary-600 hover:text-primary-800">contact@financedaily.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-700">Response Time</p>
                  <p>Within 24-48 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl p-5">
            <h3 className="font-bold text-primary-900 mb-2">Advertising</h3>
            <p className="text-sm text-primary-700">
              Interested in advertising with FinanceDaily? Contact our sales team at{' '}
              <a href="mailto:ads@financedaily.com" className="font-medium underline">ads@financedaily.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
