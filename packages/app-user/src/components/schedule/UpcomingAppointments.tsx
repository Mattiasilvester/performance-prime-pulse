

const appointments = [
  {
    id: 1,
    professional: 'Dr. Marco Rossi',
    type: 'Personal Training',
    date: 'Oggi',
    time: '15:00',
    location: 'Studio Fitness',
    avatar: '👨‍⚕️',
  },
  {
    id: 2,
    professional: 'Dott.ssa Laura Bianchi',
    type: 'Consulenza Nutrizionale',
    date: 'Domani',
    time: '10:30',
    location: 'Online',
    avatar: '👩‍⚕️',
  },
  {
    id: 3,
    professional: 'Fisio Giuseppe Verdi',
    type: 'Fisioterapia',
    date: '20 Giu',
    time: '14:00',
    location: 'Centro Medico',
    avatar: '🧑‍⚕️',
  },
];

export const UpcomingAppointments = () => {
  const dayTitle = 'Oggi, 3 Marzo';

  return (
    <div className="bg-[#16161A] rounded-[18px] p-5 border border-[rgba(255,255,255,0.06)] relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#F0EDE8]">{dayTitle}</h3>
        <button type="button" className="text-[13px] text-[#8A8A96] hover:text-[#F0EDE8] transition-colors cursor-pointer">
          Aggiungi
        </button>
      </div>

      <div className="space-y-2">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center gap-3.5 py-3.5 px-4 bg-[#1E1E24] border border-[rgba(255,255,255,0.06)] rounded-[14px]"
          >
            <div
              className="w-1 h-11 rounded-[2px] shrink-0"
              style={{ background: '#10B981' }}
              aria-hidden
            />
            <div className="text-2xl shrink-0">{appointment.avatar}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#F0EDE8] truncate">{appointment.professional}</h4>
              <p className="text-xs text-[#8A8A96] mt-0.5">
                {appointment.date} alle {appointment.time} · {appointment.type}
              </p>
              <span
                className="inline-block mt-1.5 text-[11px] font-semibold rounded-full py-0.5 px-2"
                style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}
              >
                {appointment.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full mt-4 py-3.5 rounded-[14px] border border-dashed border-[rgba(255,255,255,0.1)] bg-transparent text-sm font-semibold text-[#8A8A96] hover:text-[#F0EDE8] hover:border-[#8A8A96]/30 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span>
        Aggiungi
      </button>

      <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-[18px] z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-bold text-white mb-2">Funzionalità in arrivo</h3>
          <p className="text-sm text-gray-200">Gli appuntamenti saranno disponibili presto!</p>
        </div>
      </div>
    </div>
  );
};
