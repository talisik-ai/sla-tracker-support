import React, { Component, ErrorInfo, ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, RefreshIcon, Home01Icon } from '@hugeicons/core-free-icons'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex items-start gap-4">
              <HugeiconsIcon icon={Alert02Icon} size={40} className="text-red-500" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                <p className="text-gray-600 mb-6">
                  We're sorry, but something unexpected happened.
                </p>
                <div className="flex gap-3">
                  <Button onClick={this.handleReset}>
                    <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={() => (window.location.href = '/')} variant="outline">
                    <HugeiconsIcon icon={Home01Icon} size={16} className="mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

