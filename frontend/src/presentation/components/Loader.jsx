export function Loader() {
  return (
    <div className="loading-screen transition-opacity duration-300">
      <div className="relative w-16 h-16">
        {/* Fast and smooth dual ring spinner */}
        <div className="absolute inset-0 rounded-full border-4 border-orange-500/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" style={{ animationDuration: '0.6s' }}></div>
      </div>
      <p className="font-serif text-lg tracking-wider text-orange-500/90 animate-pulse select-none">
        Initializing Library Portal...
      </p>
    </div>
  );
}
