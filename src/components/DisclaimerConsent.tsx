'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DisclaimerConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('fd_disclaimer_accepted');
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fd_disclaimer_accepted', Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />

      {/* Consent Banner */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-4 sm:px-6 py-4 sm:py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Disclaimer & Consent</h2>
                <p className="text-primary-200 text-xs sm:text-sm">Please read carefully before continuing</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
            {/* Financial Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>⚠️</span> Financial Disclaimer
              </h3>
              <p>
                The content published on FinanceDaily is for <strong>informational and educational purposes only</strong> and does not constitute financial, investment, tax, or legal advice. 
                All articles, analyses, and opinions are provided on an "as is" basis without warranties of any kind.
              </p>
              <p className="mt-2">
                Past performance is not indicative of future results. Investing involves risk, including the possible loss of principal. 
                Always consult with a qualified financial advisor before making any investment decisions.
              </p>
            </div>

            {/* No Liability */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>🛡️</span> Limitation of Liability
              </h3>
              <p>
                FinanceDaily, its authors, editors, and affiliates shall not be held liable for any losses, damages, or claims arising from 
                the use of information provided on this website. You acknowledge that any financial decisions you make are at your own risk.
              </p>
            </div>

            {/* Cookies & Ads */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>🍪</span> Cookies & Advertising
              </h3>
              <p>
                This website uses cookies and similar technologies to improve your experience and serve personalized advertisements through 
                Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your browsing activity.
              </p>
              <p className="mt-2">
                You can manage your ad preferences at{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline hover:text-primary-800">
                  Google Ads Settings
                </a>{' '}
                or opt out at{' '}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline hover:text-primary-800">
                  aboutads.info
                </a>.
              </p>
            </div>

            {/* Third-Party Content */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <span>🔗</span> Third-Party Content
              </h3>
              <p>
                FinanceDaily may contain links to third-party websites or references to third-party products and services. 
                We do not endorse or assume responsibility for the content, privacy policies, or practices of any third-party websites.
              </p>
            </div>

            {/* Summary */}
            <p className="text-xs text-gray-400 text-center pt-2">
              By clicking "I Accept", you confirm that you have read and understood the above disclaimer. 
              You also agree to our{' '}
              <Link href="/privacy" className="text-primary-600 underline">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/terms" className="text-primary-600 underline">Terms of Service</Link>.
            </p>
          </div>

          {/* Footer / Action */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} FinanceDaily. All rights reserved.
            </p>
            <button
              onClick={handleAccept}
              className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-600/25 text-sm"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
