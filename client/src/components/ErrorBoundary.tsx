import React from 'react'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', background: 'var(--color-bg)', padding: 32, gap: 16,
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)',
        }}>
          <div style={{ fontSize: 64 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', maxWidth: 420 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
              Reload Page
            </button>
            <button className="btn-secondary" onClick={() => window.location.href = '/'}>
              Back to Map
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: 16, padding: 16, background: 'var(--color-surface)', borderRadius: 8, fontSize: 11, color: '#f87171', maxWidth: 640, overflow: 'auto', border: '1px solid rgba(239,68,68,0.2)', maxHeight: 200 }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
