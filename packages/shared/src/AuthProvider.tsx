import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextValue {
  user: unknown;
  session: unknown;
}

const AuthContext = createContext<AuthContextValue>({ user: null, session: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, session: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
