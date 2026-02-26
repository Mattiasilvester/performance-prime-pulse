// Accesso sicuro al DOM
export const safeGetElement = <T extends HTMLElement = HTMLElement>(
  id: string
): T | null => {
  if (typeof document === 'undefined') return null
  return document.getElementById(id) as T | null
}

// Accesso sicuro a localStorage
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key)
      }
    } catch (error) {
      console.warn('localStorage not available:', error)
    }
    return null
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.warn('localStorage not available:', error)
    }
    return false
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
        return true
      }
    } catch (error) {
      console.warn('localStorage not available:', error)
    }
    return false
  },
  
  clear: (): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear()
        return true
      }
    } catch (error) {
      console.warn('localStorage not available:', error)
    }
    return false
  }
}

// Accesso sicuro a sessionStorage
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem(key)
      }
    } catch (error) {
      console.warn('sessionStorage not available:', error)
    }
    return null
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.warn('sessionStorage not available:', error)
    }
    return false
  }
}

// Check sicuro per window object
export const isBrowser = () => typeof window !== 'undefined'

// Check sicuro per features specifiche
export const hasLocalStorage = (): boolean => {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
