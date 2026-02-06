export default function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-br from-white via-gray-50 to-stone/20">
      <div className="flex flex-col items-center gap-4 p-8">
        {/* Logo */}
        <img 
          src="/logo.png" 
          alt="DGNO" 
          className="h-12 mb-2 animate-pulse" 
        />
        {/* Modern spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-accent rounded-full animate-spin"></div>
        </div>
        <div className="text-sm text-inkMuted font-medium">{message}</div>
      </div>
    </div>
  );
}
