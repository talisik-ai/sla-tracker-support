import { useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '../ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show custom install banner after a short delay
      setTimeout(() => setShowBanner(true), 2000)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowBanner(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  // Don't show if already installed, no prompt available, or banner dismissed
  if (isInstalled || !showBanner || !deferredPrompt) {
    return null
  }

  // Check if user dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('pwa-banner-dismissed')
  if (dismissedAt) {
    const dismissedTime = parseInt(dismissedAt, 10)
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - dismissedTime < sevenDays) {
      return null
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <HugeiconsIcon icon={Download01Icon} size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">
              Install SLA Tracker
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Add to your home screen for quick access and offline support
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              >
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white text-xs h-8"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for programmatic install
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallable(false)

    return outcome === 'accepted'
  }

  return { isInstallable, isInstalled, install }
}

