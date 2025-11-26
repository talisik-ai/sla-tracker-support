import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

/**
 * NotificationHandler
 * 
 * Listens for notification click messages from the service worker
 * and navigates to the appropriate page.
 */
export function NotificationHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const url = event.data.url
        if (url) {
          // Use TanStack Router navigation for internal URLs
          if (url.startsWith('/')) {
            navigate({ to: url })
          } else {
            window.location.href = url
          }
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [navigate])

  // This component doesn't render anything
  return null
}

