import { Link, useLocation } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function NotFoundPage() {
  const location = useLocation();
  return (
    <div className="bg-bg flex items-center justify-center">
      <SEOHead
        title="Page not found | DGNO"
        description="The requested DGNO page could not be found."
        url={`https://dgno.us${location.pathname}`}
        robots="noindex, nofollow"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          
          {/* 404 Visual */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-accent mb-4">404</div>
            <div className="text-2xl text-gray-400 mb-2">📰</div>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-ink mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-inkMuted mb-8 max-w-lg mx-auto">
            Sorry, we couldn't find the page you're looking for. 
            The article or page may have been moved, deleted, or the URL might be incorrect.
          </p>

          {/* Navigation Options */}
          <div className="space-y-6">
            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/"
                className="bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors font-medium"
              >
                Go to Homepage
              </Link>
              <Link 
                to="/about"
                className="border border-accent text-accent px-6 py-3 rounded-full hover:bg-accent hover:text-white transition-colors font-medium"
              >
                About DGNO
              </Link>
            </div>

            {/* Secondary Navigation */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-ink mb-4">
                Browse by Section
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <Link 
                  to="/articles/immigration"
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Immigration
                </Link>
                <Link 
                  to="/articles/politics" 
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Politics
                </Link>
                <Link 
                  to="/articles/business" 
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Business
                </Link>
                <Link 
                  to="/articles/tech" 
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Tech
                </Link>
                <Link 
                  to="/articles/environment" 
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Environment
                </Link>
                <Link 
                  to="/articles/courts"
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  Courts
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="pt-8 border-t border-gray-200 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-ink mb-4">
                Need Help?
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-inkMuted">
                  If you believe this page should exist or you followed a broken link, 
                  please let us know so we can fix it.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    to="/contact"
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Report Broken Link
                  </Link>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <Link 
                    to="/contact"
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>

            {/* Go Back Button */}
            <div className="pt-4">
              <button 
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-accent transition-colors underline"
              >
                ← Go Back to Previous Page
              </button>
            </div>
          </div>

        </div>
      </div>
  );
}
