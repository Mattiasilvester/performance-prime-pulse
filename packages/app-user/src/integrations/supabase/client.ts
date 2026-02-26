import { createClient } from '@supabase/supabase-js';
import LZString from 'lz-string';

// ✅ USA PROXY VITE OTTIMIZZATO PER TOKEN GRANDI
// Il proxy Vite è configurato per gestire token 70KB+ senza errori 431
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kfxoyucatvvcgmqalxsg.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY mancante');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Pulisci sessioni corrotte per evitare 431
    storage: {
      getItem: (key: string) => {
        try {
          // Prova prima localStorage
          let item = localStorage.getItem(key);
          
          // Se non trovato, prova sessionStorage
          if (!item) {
            item = sessionStorage.getItem(key);
            if (item) {
              console.log('📍 Token retrieved from sessionStorage:', key);
            }
          }
          
          // 🔄 DECOMPRESSIONE TOKEN SE COMPRESSO
          if (item && key.includes('auth-token')) {
            try {
              // Prova a decomprimere (se è compresso)
              const decompressed = LZString.decompress(item);
              if (decompressed) {
                console.log('🗜️ Token decompressed:', {
                  originalSize: item.length,
                  decompressedSize: decompressed.length,
                  compressionRatio: ((item.length / decompressed.length) * 100).toFixed(1) + '%'
                });
                return decompressed;
              }
            } catch (e) {
              // Se non è compresso, usa il valore originale
              console.log('📦 Token not compressed, using original');
            }
            
            // 🧹 TOKEN LEAN: Rimuovi metadata non essenziali
            try {
              const parsed = JSON.parse(item);
              if (parsed.user) {
                // Mantieni solo dati essenziali per autenticazione
                const leanUser = {
                  id: parsed.user.id,
                  email: parsed.user.email,
                  role: parsed.user.role,
                  // Rimuovi metadata pesanti
                  user_metadata: {},
                  app_metadata: {}
                };
                
                const leanToken = {
                  ...parsed,
                  user: leanUser
                };
                
                const leanTokenString = JSON.stringify(leanToken);
                // Token lean applied silently
                
                return leanTokenString;
              }
            } catch (e) {
              console.error('Failed to create lean token:', e);
            }
          }
          
          return item;
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          console.log('🔑 Saving token:', key, 'Length:', value.length);
          
          // 🧹 TOKEN LEAN: Applica riduzione metadata prima del salvataggio
          let finalValue = value;
          if (key.includes('auth-token')) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.user) {
                // Crea token lean per il salvataggio
                const leanUser = {
                  id: parsed.user.id,
                  email: parsed.user.email,
                  role: parsed.user.role,
                  user_metadata: {},
                  app_metadata: {}
                };
                
                const leanToken = {
                  ...parsed,
                  user: leanUser
                };
                
                finalValue = JSON.stringify(leanToken);
                console.log('🧹 Token lean saved:', {
                  originalSize: value.length,
                  leanSize: finalValue.length,
                  reduction: ((value.length - finalValue.length) / value.length * 100).toFixed(1) + '%'
                });
              }
            } catch (e) {
              console.warn('⚠️ Lean token creation failed, using original');
            }
          }
          
          // 🗜️ COMPRESSIONE AGGIUNTIVA SE ANCORA TROPPO GRANDE
          if (finalValue.length > 20000 && key.includes('auth-token')) {
            try {
              const compressed = LZString.compress(finalValue);
              if (compressed && compressed.length < finalValue.length) {
                finalValue = compressed;
                console.log('🗜️ Token compressed:', {
                  originalSize: value.length,
                  compressedSize: compressed.length,
                  compressionRatio: ((compressed.length / value.length) * 100).toFixed(1) + '%',
                  spaceSaved: value.length - compressed.length
                });
              }
            } catch (e) {
              console.warn('⚠️ Compression failed, using lean token');
            }
          }
          
          // ✅ SALVA TOKEN (COMPRESSO O ORIGINALE)
          // Prova prima localStorage
          try {
            localStorage.setItem(key, finalValue);
            console.log('✅ Token saved to localStorage');
          } catch (localStorageError) {
            // Fallback a sessionStorage se localStorage pieno
            console.warn('⚠️ localStorage failed, using sessionStorage');
            sessionStorage.setItem(key, finalValue);
            console.log('✅ Token saved to sessionStorage');
          }
        } catch (error) {
          console.error('❌ Both storage methods failed:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch {
          // Ignore storage errors
        }
      }
    }
  }
});

