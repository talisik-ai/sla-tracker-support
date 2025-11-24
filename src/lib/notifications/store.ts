import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
    id: string
    title: string
    message: string
    type: NotificationType
    read: boolean
    timestamp: number
    link?: string
}

interface NotificationStore {
    notifications: Notification[]
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearNotifications: () => void
    unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    read: false,
                }

                set((state) => ({
                    notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
                }))
            },

            markAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                }))
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true }))
                }))
            },

            clearNotifications: () => {
                set({ notifications: [] })
            },

            unreadCount: () => {
                return get().notifications.filter((n) => !n.read).length
            }
        }),
        {
            name: 'sla-notifications',
        }
    )
)
