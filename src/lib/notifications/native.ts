/**
 * Native Push Notifications for PWA
 * 
 * This module provides native OS-level notifications that behave like desktop apps:
 * - Shows notifications in the system notification center
 * - Works even when the browser/app is not focused
 * - Clicking brings user back to the app
 * - Supports notification actions
 */

export type NativeNotificationPermission = 'default' | 'granted' | 'denied'

export interface NativeNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string // For replacing existing notifications
  requireInteraction?: boolean // Keep notification until user interacts
  silent?: boolean
  data?: {
    url?: string
    [key: string]: unknown
  }
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

/**
 * Check if native notifications are supported
 */
export function isNativeNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window
}

/**
 * Get the current notification permission status
 */
export function getNativeNotificationPermission(): NativeNotificationPermission {
  if (typeof window === 'undefined') return 'denied'
  if (!isNativeNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission as NativeNotificationPermission
}

/**
 * Request permission for native notifications
 */
export async function requestNativeNotificationPermission(): Promise<NativeNotificationPermission> {
  if (!isNativeNotificationSupported()) {
    console.warn('[Native Notifications] Not supported in this browser')
    return 'denied'
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return 'granted'
  }

  // Already denied - can't ask again
  if (Notification.permission === 'denied') {
    console.warn('[Native Notifications] Permission previously denied')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[Native Notifications] Permission result:', permission)
    return permission as NativeNotificationPermission
  } catch (error) {
    console.error('[Native Notifications] Error requesting permission:', error)
    return 'denied'
  }
}

/**
 * Show a native notification
 */
export function showNativeNotification(options: NativeNotificationOptions): Notification | null {
  if (!isNativeNotificationSupported()) {
    console.warn('[Native Notifications] Not supported')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Native Notifications] Permission not granted')
    return null
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/sla_dashboard_icon.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      data: options.data,
    })

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault()
      
      // Focus the window/tab
      window.focus()

      // Navigate to the specified URL if provided
      if (options.data?.url) {
        window.location.href = options.data.url
      }

      // Close the notification
      notification.close()
    }

    notification.onerror = (error) => {
      console.error('[Native Notifications] Error showing notification:', error)
    }

    return notification
  } catch (error) {
    console.error('[Native Notifications] Failed to show notification:', error)
    return null
  }
}

/**
 * Show a native notification using Service Worker (works when app is closed)
 */
export async function showServiceWorkerNotification(
  options: NativeNotificationOptions
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Native Notifications] Service Worker not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Native Notifications] Permission not granted')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/sla_dashboard_icon.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      data: options.data,
      // Service worker notifications can have actions
      actions: options.actions,
    })
  } catch (error) {
    console.error('[Native Notifications] SW notification failed:', error)
    // Fallback to regular notification
    showNativeNotification(options)
  }
}

/**
 * Map notification type to icon emoji for display
 */
function getNotificationIcon(type: string): string {
  switch (type) {
    case 'error':
      return '🚨'
    case 'warning':
      return '⚠️'
    case 'success':
      return '✅'
    default:
      return '🔔'
  }
}

/**
 * Show a native notification for SLA alerts
 */
export function showSLANotification(
  type: 'at-risk' | 'breached' | 'first-response-risk' | 'first-response-breached' | 'info',
  title: string,
  message: string,
  link?: string
): void {
  // Determine notification urgency
  const isUrgent = type === 'breached' || type === 'first-response-breached'
  
  const icon = type === 'breached' || type === 'first-response-breached' 
    ? '🚨' 
    : type === 'at-risk' || type === 'first-response-risk'
    ? '⚠️'
    : '📊'

  showNativeNotification({
    title: `${icon} ${title}`,
    body: message,
    tag: `sla-${type}-${title}`, // Replace similar notifications
    requireInteraction: isUrgent, // Keep on screen if urgent
    data: {
      url: link || '/issues',
    },
  })
}

/**
 * Settings storage key
 */
const NATIVE_NOTIFICATION_SETTINGS_KEY = 'sla-native-notifications'

/**
 * Get native notification enabled state
 */
export function getNativeNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem(NATIVE_NOTIFICATION_SETTINGS_KEY)
    return stored === 'true'
  } catch {
    return false
  }
}

/**
 * Set native notification enabled state
 */
export function setNativeNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(NATIVE_NOTIFICATION_SETTINGS_KEY, enabled ? 'true' : 'false')
  } catch (error) {
    console.error('[Native Notifications] Failed to save setting:', error)
  }
}

