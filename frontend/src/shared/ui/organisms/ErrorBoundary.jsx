import { Component } from 'react'
import { logger } from '@/shared/utils/logger'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    logger.error('ErrorBoundary caught an error', { error, info })
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message ? String(this.state.error.message) : ''

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
          <div className="w-full max-w-xl rounded-xl border border-border bg-surface-elevated p-xl text-center shadow-card">
            <h1 className="text-2xl font-bold text-text-primary mb-md">Something went wrong</h1>
            <p className="text-text-secondary mb-lg">An unexpected error occurred. Try recovering without reloading first.</p>

            {errorMessage ? (
              <p className="mb-lg rounded-md border border-border bg-surface-3 p-sm text-left text-xs text-text-secondary">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-md border border-border bg-surface px-lg py-sm text-sm font-medium text-text-primary hover:bg-surface-3"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-primary px-lg py-sm text-sm font-medium text-white hover:bg-primary-hover"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}