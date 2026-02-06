// footer.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTiktok, faInstagram } from "@fortawesome/free-brands-svg-icons";


export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink border-t border-stone/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* About Section */}
          <div className="md:col-span-2">
            <a href="/" className="inline-block group mb-4">
              <img src="/logo.png" alt="DGNO" className="h-12 invert transition-all duration-300 group-hover:opacity-80" />
            </a>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              Very pro democracy, unapologetically anti-corruption. Join us in making a difference through independent journalism.
            </p>
            {/* Newsletter Hint */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white text-sm font-medium mb-1">📬 Stay Informed</p>
              <p className="text-gray-400 text-xs">Subscribe to get breaking news and investigations delivered to your inbox.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-300 hover:text-accent text-sm transition-colors duration-200 flex items-center gap-2 group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  About Us
                </a>
              </li>
              <li>
                <a href="/trackers" className="text-gray-300 hover:text-accent text-sm transition-colors duration-200 flex items-center gap-2 group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Incident Trackers
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-accent text-sm transition-colors duration-200 flex items-center gap-2 group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-300 hover:text-accent text-sm transition-colors duration-200 flex items-center gap-2 group">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex gap-3">
              <a 
                href="https://www.tiktok.com/@dgnonews" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="TikTok" 
                className="w-10 h-10 bg-white/10 hover:bg-accent text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <FontAwesomeIcon icon={faTiktok} className="text-lg" />
              </a>
              <a 
                href="https://www.instagram.com/dgnonews" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                className="w-10 h-10 bg-white/10 hover:bg-accent text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <FontAwesomeIcon icon={faInstagram} className="text-lg" />
              </a>
            </div>    
            <p className="text-gray-400 text-xs mt-4">@dgnonews on all platforms</p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">&copy; {currentYear} DGNO. All rights reserved.</p>
          <p className="text-xs text-gray-500">Independent, Pro-Democracy News</p>
        </div>
      </div>
    </footer>
  );
}
