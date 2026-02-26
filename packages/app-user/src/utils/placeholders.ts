/**
 * Utility per identificare valori placeholder (non validi per "completezza dati" report / UI).
 * Considerati placeholder: null, empty, "PENDING", "Da completare", "-", CAP "00000".
 */
export function isPlaceholderValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  if (v === '') return true;
  if (v.toLowerCase() === 'pending') return true;
  if (v.toLowerCase() === 'da completare') return true;
  if (v === '-') return true;
  if (v === '00000') return true;
  return false;
}
