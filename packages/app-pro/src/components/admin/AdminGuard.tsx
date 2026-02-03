import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuthBypass as useAdminAuth } from '@/hooks/useAdminAuthBypass'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthorized, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Verificando autorizzazioni...</p>
        </div>
      </div>
    )
  }

  // TEMPORARY BYPASS per debug - rimuovere in produzione
  console.log('🔒 AdminGuard Debug:', { isAuthorized, loading });
  
  // BYPASS COMPLETO per debug - accesso sempre consentito
  if (!isAuthorized) {
    console.log('⚠️ BYPASS ATTIVO - Accesso consentito senza autenticazione per debug');
    // Commento il redirect per permettere l'accesso
    // return <Navigate to="/nexus-prime-control" replace />
  }

  return <>{children}</>
}
