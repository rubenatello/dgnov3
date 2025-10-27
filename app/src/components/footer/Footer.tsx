// footer.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTiktok, faInstagram } from "@fortawesome/free-brands-svg-icons";


export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink border-t border-stone mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-3">
               <img src="/logo.png" alt="DGNO" className="h-14 invert hover:invert-80" />
            </a>
          </div>
            <p className="text-white text-sm">
              Very pro democracy, unapologetically anti-corruption. Join us in making a difference.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="text-white hover:text-accent transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-white hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-white hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social - Tiktok and Instagram @ dgnonews */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@dgnonews" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="TikTok" 
              className="text-white hover:text-accent transition-colors"
              >
               <FontAwesomeIcon icon={faTiktok} className="text-2xl" />
              </a>
              <a href="https://www.instagram.com/dgnonews" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram" 
              className="text-white hover:text-accent transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
              </a>
            </div>    
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-stone text-center text-sm text-inkMuted">
          <p>&copy; {currentYear} DGNO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
