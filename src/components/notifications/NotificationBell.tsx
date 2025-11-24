import * as React from 'react'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore } from '@/lib/notifications/store'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
    const [open, setOpen] = React.useState(false)
    const count = unreadCount()

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id)
        if (link) {
            setOpen(false)
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
                    {count > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
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
            </PopoverContent>
        </Popover>
    )
}

function NotificationContent({ notification, getIcon }: { notification: any; getIcon: (type: string) => string }) {
    return (
        <>
            <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>
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
