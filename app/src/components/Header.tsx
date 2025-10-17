export default function Header() {
  return (
    <>
      {/* Top Bar - Dark with Subscribe/Login */}
      <div className="bg-[#232425ff] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-10 gap-3">
            <a 
              href="#subscribe"
              className="text-sm px-5 py-1.5 bg-transparent border border-white text-white rounded-full hover:bg-accent hover:border-accent transition-all duration-300"
            >
              Subscribe
            </a>
            <a 
              href="/login"
              className="text-sm px-5 py-1.5 bg-white text-ink rounded-full hover:bg-accent hover:text-white transition-all duration-300"
            >
              Login
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-stone sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center gap-3">
                 <img src="/logo.png" alt="DGNO" className="h-14" />
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-ink hover:text-accent transition-colors">
                Home
              </a>
              <a href="/articles" className="text-ink hover:text-accent transition-colors">
                Articles
              </a>
              <a href="/about" className="text-ink hover:text-accent transition-colors">
                About
              </a>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-ink hover:text-accent p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
