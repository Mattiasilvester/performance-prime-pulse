const TRAGUARDI = [
  { emoji: '📅', name: 'Settimana Perfetta' },
  { emoji: '🔥', name: 'Brucia Grassi' },
  { emoji: '❤️', name: 'Resistenza Pro' },
  { emoji: '💪', name: 'Forza Massima' },
  { emoji: '🎯', name: 'Costanza Mensile' },
  { emoji: '🏆', name: 'Campione Performance' },
];

export const AchievementsBoard = () => {
  return (
    <div className="bg-[#16161A] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#F0EDE8]">Traguardi</h3>
        <span className="text-[13px] text-[#8A8A96]">Tutti</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {TRAGUARDI.map((t, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 py-3 px-1 opacity-[0.35]"
          >
            <span className="text-[28px]">{t.emoji}</span>
            <span className="text-[10px] font-semibold text-[#8A8A96] text-center leading-tight">
              {t.name}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[#16161A]/80 backdrop-blur-sm rounded-[14px] z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-bold text-[#F0EDE8] mb-2">Funzionalità in arrivo</h3>
          <p className="text-[13px] text-[#8A8A96]">L'albo delle medaglie sarà disponibile presto!</p>
        </div>
      </div>
    </div>
  );
};
