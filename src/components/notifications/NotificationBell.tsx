import * as React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
    Notification01Icon, 
    Delete02Icon, 
    Settings01Icon, 
    VolumeHighIcon, 
    VolumeOffIcon, 
    Notification03Icon, 
    NotificationOff01Icon 
} from '@hugeicons/core-free-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore, Notification } from '@/lib/notifications/store'
import { getNotificationSettings, saveNotificationSettings, playNotificationSound } from '@/lib/notifications/helpers'
import { 
    requestNativeNotificationPermission, 
    getNativeNotificationPermission,
    getNativeNotificationsEnabled,
    setNativeNotificationsEnabled,
    showNativeNotification,
    isNativeNotificationSupported
} from '@/lib/notifications/native'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore()
    const [open, setOpen] = React.useState(false)
    const [soundEnabled, setSoundEnabled] = React.useState(false)
    const [nativeEnabled, setNativeEnabled] = React.useState(false)
    const [nativePermission, setNativePermission] = React.useState<'default' | 'granted' | 'denied'>('default')
    const [nativeSupported, setNativeSupported] = React.useState(false)
    const count = unreadCount()
    const prevCountRef = React.useRef(count)

    // Load settings on mount (client-side only)
    React.useEffect(() => {
        const settings = getNotificationSettings()
        setSoundEnabled(settings.soundEnabled)
        setNativeSupported(isNativeNotificationSupported())
        setNativeEnabled(getNativeNotificationsEnabled())
        setNativePermission(getNativeNotificationPermission())
    }, [])

    // Play sound when new notifications arrive
    React.useEffect(() => {
        if (count > prevCountRef.current && soundEnabled) {
            const latestNotification = notifications[0]
            if (latestNotification) {
                playNotificationSound(latestNotification.type)
            }
        }
        prevCountRef.current = count
    }, [count, notifications, soundEnabled])

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id)
        if (link) {
            setOpen(false)
        }
    }

    const toggleSound = () => {
        const newValue = !soundEnabled
        setSoundEnabled(newValue)
        saveNotificationSettings({ soundEnabled: newValue })
        
        // Play a test sound when enabling
        if (newValue) {
            playNotificationSound('info')
        }
    }

    const toggleNativeNotifications = async () => {
        if (!nativeSupported) {
            console.warn('Native notifications not supported')
            return
        }

        if (!nativeEnabled) {
            // Enabling - need to request permission first
            const permission = await requestNativeNotificationPermission()
            setNativePermission(permission)
            
            if (permission === 'granted') {
                setNativeEnabled(true)
                setNativeNotificationsEnabled(true)
                saveNotificationSettings({ nativeEnabled: true })
                
                // Show a test notification
                showNativeNotification({
                    title: '🔔 Notifications Enabled',
                    body: 'You will now receive desktop notifications for SLA alerts',
                    tag: 'test-notification',
                })
            } else if (permission === 'denied') {
                console.warn('Native notification permission denied')
            }
        } else {
            // Disabling
            setNativeEnabled(false)
            setNativeNotificationsEnabled(false)
            saveNotificationSettings({ nativeEnabled: false })
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'error':
                return '🔴'
            case 'warning':
                return '⚠️'
            case 'success':
                return '✅'
            default:
                return '🔔'
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <HugeiconsIcon icon={Notification01Icon} size={20} />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <div className="flex items-center gap-1">
                        {/* Native Notifications Toggle */}
                        {nativeSupported && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${nativeEnabled ? 'text-blue-500' : ''}`}
                                onClick={toggleNativeNotifications}
                                title={
                                    nativePermission === 'denied' 
                                        ? 'Desktop notifications blocked - enable in browser settings' 
                                        : nativeEnabled 
                                        ? 'Disable desktop notifications' 
                                        : 'Enable desktop notifications'
                                }
                                disabled={nativePermission === 'denied'}
                            >
                                {nativeEnabled ? (
                                    <HugeiconsIcon icon={Notification03Icon} size={16} />
                                ) : (
                                    <HugeiconsIcon icon={NotificationOff01Icon} size={16} className="text-muted-foreground" />
                                )}
                            </Button>
                        )}
                        
                        {/* Sound Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={toggleSound}
                            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                        >
                            {soundEnabled ? (
                                <HugeiconsIcon icon={VolumeHighIcon} size={16} className="text-muted-foreground" />
                            ) : (
                                <HugeiconsIcon icon={VolumeOffIcon} size={16} className="text-muted-foreground" />
                            )}
                        </Button>
                        
                        {/* Settings Link */}
                        <Link to="/settings" onClick={() => setOpen(false)}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Notification settings"
                            >
                                <HugeiconsIcon icon={Settings01Icon} size={16} className="text-muted-foreground" />
                            </Button>
                        </Link>
                        
                        {/* Mark All as Read */}
                        {count > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                            <HugeiconsIcon icon={Notification01Icon} size={32} className="mb-2 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-muted/30' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification.id, notification.link)}
                                >
                                    {notification.link ? (
                                        <Link to={notification.link} className="block">
                                            <NotificationContent notification={notification} getIcon={getNotificationIcon} />
                                        </Link>
                                    ) : (
                                        <NotificationContent notification={notification} getIcon={getNotificationIcon} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                {/* Clear All Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-muted-foreground hover:text-destructive"
                                >
                                    <HugeiconsIcon icon={Delete02Icon} size={12} className="mr-1" />
                                    Clear all notifications
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently remove all {notifications.length} notifications. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={clearNotifications}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Clear All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

function NotificationContent({ notification, getIcon }: { notification: Notification; getIcon: (type: string) => string }) {
    return (
        <>
            <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{getIcon(notification.type)}</span>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        {!notification.read && (
                            <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full bg-blue-600" />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                </div>
            </div>
        </>
    )
}
