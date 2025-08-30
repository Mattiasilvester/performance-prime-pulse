import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // Qui potresti inviare l'errore a un servizio di tracking
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Ops! Qualcosa è andato storto
            </h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'Si è verificato un errore imprevisto'}
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-yellow-500 text-black font-bold py-3 px-4 rounded hover:bg-yellow-600 transition"
              >
                Riprova
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-800 text-white py-3 px-4 rounded hover:bg-gray-700 transition"
              >
                Torna alla Home
              </button>
            </div>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 cursor-pointer">
                  Dettagli errore (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
