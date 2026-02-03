import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@pp/shared';

export const MVPHomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-pp-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-pp-gold text-xl">Caricamento Performance Prime...</p>
        </div>
      </div>
    );
  }

  // Redirect automatico basato su autenticazione
  return <Navigate to={user ? '/app' : '/auth'} replace />;
};