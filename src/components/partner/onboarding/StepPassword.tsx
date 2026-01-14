import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepPasswordProps {
  data: {
    password: string;
    password_confirm: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepPassword({ data, onChange, errors }: StepPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Almeno 8 caratteri');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Almeno una lettera minuscola');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Almeno una lettera maiuscola');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Almeno un numero');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const passwordValidation = validatePassword(data.password);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sicurezza</h2>
        <p className="text-gray-600">Crea una password sicura per il tuo account</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
          Password *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            className={`w-full px-4 py-3 pr-12 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.password ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Minimo 8 caratteri"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
        {data.password && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">La password deve contenere:</p>
            <ul className="text-xs space-y-0.5">
              <li className={data.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}>
                {data.password.length >= 8 ? '✓' : '○'} Almeno 8 caratteri
              </li>
              <li className={/[a-z]/.test(data.password) ? 'text-green-500' : 'text-gray-400'}>
                {/[a-z]/.test(data.password) ? '✓' : '○'} Una lettera minuscola
              </li>
              <li className={/[A-Z]/.test(data.password) ? 'text-green-500' : 'text-gray-400'}>
                {/[A-Z]/.test(data.password) ? '✓' : '○'} Una lettera maiuscola
              </li>
              <li className={/[0-9]/.test(data.password) ? 'text-green-500' : 'text-gray-400'}>
                {/[0-9]/.test(data.password) ? '✓' : '○'} Un numero
              </li>
            </ul>
          </div>
        )}
        <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Evita password comuni come "Password123" o "Qwerty123". Usa una combinazione unica.</span>
        </p>
      </div>

      <div>
        <label htmlFor="password_confirm" className="block text-gray-700 font-medium mb-2">
          Conferma Password *
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="password_confirm"
            value={data.password_confirm}
            onChange={(e) => onChange('password_confirm', e.target.value)}
            className={`w-full px-4 py-3 pr-12 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 ${
              errors.password_confirm ? 'border-red-300' : 'border-gray-600'
            }`}
            placeholder="Ripeti la password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password_confirm && (
          <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
        )}
        {data.password_confirm && data.password !== data.password_confirm && (
          <p className="mt-1 text-sm text-red-600">Le password non coincidono</p>
        )}
      </div>
    </motion.div>
  );
}

