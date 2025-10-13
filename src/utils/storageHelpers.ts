// Utility per gestire storage in modo sicuro
import { safeLocalStorage, safeSessionStorage } from './domHelpers'

// Wrapper per localStorage con fallback
export const storage = {
  // Local Storage
  get: (key: string): string | null => safeLocalStorage.getItem(key),
  set: (key: string, value: string): boolean => safeLocalStorage.setItem(key, value),
  remove: (key: string): boolean => safeLocalStorage.removeItem(key),
  clear: (): boolean => safeLocalStorage.clear(),
  
  // Session Storage
  getSession: (key: string): string | null => safeSessionStorage.getItem(key),
  setSession: (key: string, value: string): boolean => safeSessionStorage.setItem(key, value),
  
  // JSON helpers
  getJSON: <T>(key: string, defaultValue: T): T => {
    try {
      const item = safeLocalStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  setJSON: <T>(key: string, value: T): boolean => {
    try {
      const jsonValue = JSON.stringify(value)
      return safeLocalStorage.setItem(key, jsonValue)
    } catch {
      return false
    }
  },
  
  // Array helpers
  getArray: <T>(key: string, defaultValue: T[] = []): T[] => {
    return storage.getJSON(key, defaultValue)
  },
  
  setArray: <T>(key: string, value: T[]): boolean => {
    return storage.setJSON(key, value)
  },
  
  // Object helpers
  getObject: <T extends Record<string, any>>(key: string, defaultValue: T): T => {
    return storage.getJSON(key, defaultValue)
  },
  
  setObject: <T extends Record<string, any>>(key: string, value: T): boolean => {
    return storage.setJSON(key, value)
  }
}

// Esporta anche le funzioni originali per compatibilità
export { safeLocalStorage, safeSessionStorage }
