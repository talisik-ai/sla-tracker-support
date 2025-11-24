import { useNotificationStore } from './store'

/**
 * Create demo notifications for testing (development only)
 */
export function createDemoNotifications() {
    const { addNotification } = useNotificationStore.getState()

    addNotification({
        type: 'warning',
        title: 'SLA At Risk',
        message: 'SWA2-775 is approaching its SLA deadline (82% time used)',
        link: '/issues?search=SWA2-775'
    })

    addNotification({
        type: 'error',
        title: 'SLA Breached',
        message: 'SWA2-123 has breached its SLA deadline (105% time used)',
        link: '/issues?search=SWA2-123'
    })

    addNotification({
        type: 'info',
        title: 'System Update',
        message: 'The SLA Tracker has been updated with new features.',
    })

    console.log('Demo notifications created!')
}

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
    (window as any).createDemoNotifications = createDemoNotifications
}
