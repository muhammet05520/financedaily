'use client';

export default function NewsletterSignup() {
  return (
    <section id="newsletter" className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 rounded-2xl overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-700/50 rounded-full mb-6">
          <span className="text-sm">📧</span>
          <span className="text-xs font-medium text-primary-200 uppercase tracking-wider">Free Newsletter</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Stay Ahead of the Markets
        </h2>
        <p className="text-base text-primary-300 mb-8 max-w-lg mx-auto">
          Join 50,000+ investors who receive our daily market analysis, breaking news, and expert insights — delivered free every morning.
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Enter your email address"
            className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-primary-900 text-sm font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-lg shadow-black/20"
          >
            Subscribe →
          </button>
        </form>

        <p className="text-xs text-primary-500 mt-4">
          No spam. Unsubscribe anytime. Read our <a href="/privacy" className="underline hover:text-primary-300">Privacy Policy</a>.
        </p>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-primary-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free forever
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            No spam
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Daily insights
          </div>
        </div>
      </div>
    </section>
  );
}
