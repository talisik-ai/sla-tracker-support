import { useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '../ui/button'

export function PWAUpdatePrompt() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                setShowUpdateBanner(true)
              }
            })
          }
        })
      })

      // Handle controller change (when update is applied)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdateBanner(false)
  }

  const handleDismiss = () => {
    setShowUpdateBanner(false)
  }

  if (!showUpdateBanner) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 border border-emerald-700 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <HugeiconsIcon icon={RefreshIcon} size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">Update Available</h3>
            <p className="text-emerald-200 text-xs mt-1">
              A new version of SLA Tracker is available
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              >
                <HugeiconsIcon icon={RefreshIcon} size={12} className="mr-1" />
                Update Now
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-emerald-300 hover:text-white text-xs h-8"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-emerald-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

