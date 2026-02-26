import React, { Component, ErrorInfo, ReactNode } from 'react'
import { errorHandler, ErrorContext } from '@/services/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      timestamp: new Date()
    }

    // Usa il servizio centralizzato per gestire l'errore
    const errorInfo_processed = errorHandler.handleError(error, context)
    
    // Log per debug (solo in sviluppo)
    if (import.meta.env.DEV) {
      console.group(`🚨 ErrorBoundary caught error [${errorInfo_processed.severity}]`)
      console.error('Error:', error)
      console.error('ErrorInfo:', errorInfo)
      console.error('Processed:', errorInfo_processed)
      console.groupEnd()
    }

    this.setState({ errorInfo })
    
    // Callback personalizzato se fornito
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const userMessage = this.state.error 
        ? errorHandler.handleError(this.state.error, {}).userMessage
        : 'Si è verificato un errore imprevisto'

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="max-w-lg w-full bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            {/* Icona */}
            <div className="text-6xl mb-6">
              <div className="inline-block animate-bounce">🚨</div>
            </div>
            
            {/* Titolo */}
            <h1 className="text-2xl font-bold text-white mb-4">
              Ops! Qualcosa è andato storto
            </h1>
            
            {/* Messaggio user-friendly */}
            <p className="text-gray-300 mb-2 text-lg">
              {userMessage}
            </p>
            
            {/* ID errore per supporto */}
            {this.state.errorId && (
              <p className="text-gray-500 text-sm mb-6">
                ID Errore: {this.state.errorId}
              </p>
            )}
            
            {/* Azioni */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105"
              >
                🔄 Riprova
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                🏠 Torna alla Home
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                🔄 Ricarica Pagina
              </button>
            </div>
            
            {/* Suggerimenti */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="text-white font-semibold mb-2">💡 Suggerimenti:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Controlla la tua connessione internet</li>
                <li>• Prova a ricaricare la pagina</li>
                <li>• Se il problema persiste, contatta il supporto</li>
              </ul>
            </div>
            
            {/* Dettagli tecnici (solo in sviluppo) */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                  🔧 Dettagli tecnici (Dev Mode)
                </summary>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <div className="mb-2">
                    <strong className="text-red-400">Error:</strong>
                    <pre className="text-xs text-gray-300 mt-1 overflow-auto">
                      {this.state.error?.stack || this.state.error?.message}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-red-400">Component Stack:</strong>
                    <pre className="text-xs text-gray-300 mt-1 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
