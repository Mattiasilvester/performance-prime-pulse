export function ProgressScreen() {
  return (
    <div className="bg-[#0a0a0a] text-white min-h-[600px] md:min-h-[700px] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">I tuoi progressi</h2>
        <p className="text-gray-400 text-sm">Questa settimana</p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-gray-400 text-xs mb-1">Allenamenti</p>
          <p className="text-2xl font-bold text-[#EEBA2B]">12</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-gray-400 text-xs mb-1">Streak</p>
          <p className="text-2xl font-bold text-[#EEBA2B]">7</p>
        </div>
      </div>

      {/* Grafico placeholder */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-[#2a2a2a]">
        <p className="text-gray-400 text-xs mb-4">Progressione settimanale</p>
        <div className="flex items-end justify-between h-32 gap-2">
          {[65, 75, 70, 85, 80, 90, 95].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-[#EEBA2B] rounded-t"
                style={{ height: `${height}%` }}
              />
              <span className="text-gray-500 text-xs mt-2">
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="bg-gradient-to-r from-[#EEBA2B]/20 to-[#EEBA2B]/10 rounded-xl p-4 border border-[#EEBA2B]/30">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🏆</div>
          <div>
            <p className="text-white font-semibold">Settimana perfetta!</p>
            <p className="text-[#EEBA2B] text-sm">7 giorni consecutivi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

