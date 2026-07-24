export function BookCover({ title = 'Untitled Book', author = 'Unknown' }) {
  // Generate a stable hash color index from the title
  const getHashColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 5;
  };

  const gradients = [
    { from: '#652312', to: '#200803', binding: '#4b1509', accent: '#fdba74' }, // Rich Terracotta
    { from: '#064e3b', to: '#021810', binding: '#042f2e', accent: '#6ee7b7' }, // Deep Forest Sage
    { from: '#1e1b4b', to: '#08051a', binding: '#17153b', accent: '#c7d2fe' }, // Royal Navy/Indigo
    { from: '#4c0519', to: '#140106', binding: '#31040f', accent: '#fecdd3' }, // Crimson Burgundy
    { from: '#3b0764', to: '#0f021c', binding: '#24043f', accent: '#e9d5ff' }, // Royal Plum/Grape
  ];

  const theme = gradients[getHashColor(title)];

  return (
    <div 
      className="relative w-full h-full rounded shadow-md overflow-hidden flex flex-col justify-between p-3 select-none"
      style={{
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        borderLeft: `7px solid ${theme.binding}`,
        boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.1), 1px 2px 4px rgba(0,0,0,0.5)'
      }}
    >
      {/* Decorative inner border frame */}
      <div 
        className="absolute inset-1 pointer-events-none border rounded-sm opacity-20"
        style={{ borderColor: theme.accent, borderStyle: 'double', borderWidth: '3px' }}
      ></div>

      {/* Book Binding Shadow Overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/15 to-transparent pointer-events-none"></div>

      {/* Book Logo Ornament */}
      <div className="w-full flex justify-center mt-1 opacity-45">
        <svg className="w-6 h-6" fill="none" stroke={theme.accent} strokeWidth="1.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
        </svg>
      </div>

      {/* Book Title */}
      <div className="flex-grow flex items-center justify-center text-center px-1 my-1 z-10">
        <span 
          className="font-serif font-bold text-xs tracking-tight text-white leading-tight line-clamp-3"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
        >
          {title}
        </span>
      </div>

      {/* Book Author */}
      <div className="text-center px-1 z-10 pb-0.5">
        <span 
          className="block font-sans text-[8px] uppercase tracking-widest font-semibold opacity-90 truncate"
          style={{ color: theme.accent, textShadow: '1px 1px 1px rgba(0,0,0,0.6)' }}
        >
          {author}
        </span>
      </div>
    </div>
  );
}
