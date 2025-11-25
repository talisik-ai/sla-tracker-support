import * as React from 'react'
import { Bell, Trash2, Settings, Volume2, VolumeX } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore, Notification } from '@/lib/notifications/store'
import { getNotificationSettings, saveNotificationSettings, playNotificationSound } from '@/lib/notifications/helpers'
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
    const count = unreadCount()
    const prevCountRef = React.useRef(count)

    // Load sound setting on mount
    React.useEffect(() => {
        const settings = getNotificationSettings()
        setSoundEnabled(settings.soundEnabled)
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
                    <Bell className="h-5 w-5" />
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
                        {/* Sound Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={toggleSound}
                            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                        >
                            {soundEnabled ? (
                                <Volume2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <VolumeX className="h-4 w-4 text-muted-foreground" />
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
                                <Settings className="h-4 w-4 text-muted-foreground" />
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
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
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
                                    <Trash2 className="h-3 w-3 mr-1" />
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
