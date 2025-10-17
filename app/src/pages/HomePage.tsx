export default function HomePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-heading font-bold text-ink mb-6">
          DGNO
        </h1>
        <h2 className="text-2xl md:text-3xl font-heading text-inkMuted mb-8">
          Coming Soon
        </h2>
        <p className="text-lg text-sand max-w-lg mx-auto">
          We're building something special. Stay tuned for groundbreaking news and original reporting.
        </p>
        
        {/* Optional: Email signup */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
            />
            <button className="px-6 py-3 bg-accent text-paper rounded-lg hover:bg-opacity-90 transition-all font-medium">
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
