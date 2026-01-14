import { motion } from 'framer-motion';

interface StepPersonalInfoProps {
  data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  onEmailBlur?: () => void;
  isCheckingEmail?: boolean;
}

export function StepPersonalInfo({ data, onChange, errors, onEmailBlur, isCheckingEmail }: StepPersonalInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dati personali</h2>
        <p className="text-gray-600">Iniziamo con le tue informazioni di base</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="first_name" className="block text-gray-700 font-medium mb-2">
            Nome *
          </label>
          <input
            type="text"
            id="first_name"
            value={data.first_name}
            onChange={(e) => onChange('first_name', e.target.value)}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.first_name ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Mario"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-gray-700 font-medium mb-2">
            Cognome *
          </label>
          <input
            type="text"
            id="last_name"
            value={data.last_name}
            onChange={(e) => onChange('last_name', e.target.value)}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.last_name ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Rossi"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email *
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={onEmailBlur}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.email ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="mario.rossi@example.com"
          />
          {isCheckingEmail && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-[var(--partner-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
          Telefono *
        </label>
        <input
          type="tel"
          id="phone"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
            errors.phone ? 'border-red-300' : 'border-gray-600'
          }`}
          placeholder="+39 123 456 7890"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>
    </motion.div>
  );
}

