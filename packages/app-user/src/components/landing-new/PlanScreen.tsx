export function PlanScreen() {
  const exercises = [
    { name: 'Flessioni', sets: '3x12', icon: '💪' },
    { name: 'Squat', sets: '3x15', icon: '🦵' },
    { name: 'Plank', sets: '3x30s', icon: '🔥' },
    { name: 'Burpees', sets: '2x10', icon: '⚡' },
  ];

  return (
    <div className="bg-[#0a0a0a] text-white min-h-[600px] md:min-h-[700px] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Il tuo piano</h2>
        <p className="text-gray-400 text-sm">Allenamento completo</p>
      </div>

      {/* Lista esercizi */}
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4 border border-[#2a2a2a]"
          >
            <div className="text-3xl">{exercise.icon}</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">{exercise.name}</h3>
              <p className="text-[#EEBA2B] text-sm">{exercise.sets}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#EEBA2B]/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#EEBA2B]" />
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="mt-8">
        <button className="w-full bg-[#EEBA2B] text-black font-bold py-4 rounded-xl">
          Inizia Allenamento
        </button>
      </div>
    </div>
  );
}

