/**
 * Service Worker Notification Handler
 * 
 * This module sets up handlers for service worker events related to notifications.
 * It should be called once when the app initializes.
 */

/**
 * Initialize service worker notification handlers
 */
export function initServiceWorkerNotificationHandlers(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      const url = event.data.url
      if (url) {
        // Navigate to the URL
        window.location.href = url
      }
    }
  })
}

/**
 * Register a custom service worker script that handles notification clicks
 * This needs to be injected into the PWA service worker
 */
export const SW_NOTIFICATION_HANDLER = `
// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window and navigate
            client.postMessage({ type: 'NOTIFICATION_CLICK', url });
            return client.focus();
          }
        }
        // No existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});
`;

