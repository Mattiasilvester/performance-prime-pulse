import { motion } from 'framer-motion';

interface StepBioProps {
  bio: string;
  onChange: (value: string) => void;
  error?: string;
}

export function StepBio({ bio, onChange, error }: StepBioProps) {
  const maxLength = 500;
  const remaining = maxLength - bio.length;
  const isNearLimit = remaining < 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Presentati</h2>
        <p className="text-gray-600">Descriviti brevemente e racconta la tua esperienza</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
          Descriviti brevemente *
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value);
            }
          }}
          rows={6}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--partner-accent)] focus:border-transparent outline-none transition-all duration-200 resize-none ${
            error ? 'border-red-300' : 'border-gray-600'
          }`}
          placeholder="Racconta la tua esperienza, il tuo approccio e cosa ti distingue..."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {bio.length > 0 ? 'Almeno 50 caratteri consigliati' : ''}
          </p>
          <p className={`text-xs font-medium ${
            isNearLimit ? 'text-red-600' : 'text-gray-500'
          }`}>
            {bio.length}/{maxLength}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

