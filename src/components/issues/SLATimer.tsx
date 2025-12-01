import * as React from "react"
import { cn } from "@/lib/utils"
import { differenceInMinutes } from "date-fns"

interface SLATimerProps {
    deadlineHours: number
    createdDate: Date
    resolvedDate?: Date | null
    className?: string
}

export const SLATimer = React.memo(function SLATimer({
    deadlineHours,
    createdDate,
    resolvedDate,
    className
}: SLATimerProps) {
    const [now, setNow] = React.useState(new Date())

    React.useEffect(() => {
        if (resolvedDate) return

        const interval = setInterval(() => {
            setNow(new Date())
        }, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [resolvedDate])

    const deadlineMinutes = deadlineHours * 60
    const timeElapsed = resolvedDate
        ? differenceInMinutes(resolvedDate, createdDate)
        : differenceInMinutes(now, createdDate)

    const timeRemaining = deadlineMinutes - timeElapsed
    const percentageUsed = (timeElapsed / deadlineMinutes) * 100

    let status: 'on-track' | 'at-risk' | 'breached' | 'met' = 'on-track'

    if (percentageUsed >= 100) {
        status = 'breached'
    } else if (resolvedDate) {
        status = 'met'
    } else if (percentageUsed >= 75) {
        status = 'at-risk'
    }

    const statusColors = {
        'on-track': 'bg-green-500',
        'at-risk': 'bg-gradient-to-r from-amber-500 to-orange-500',
        'breached': 'bg-gradient-to-r from-red-500 to-red-600',
        'met': 'bg-gradient-to-r from-teal-500 to-emerald-500'
    }

    const statusBgColors = {
        'on-track': 'bg-green-100 dark:bg-green-950/30',
        'at-risk': 'bg-amber-100 dark:bg-amber-950/30',
        'breached': 'bg-red-100 dark:bg-red-950/30',
        'met': 'bg-teal-100 dark:bg-teal-950/30'
    }

    const statusLabelStyles = {
        'on-track': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
        'at-risk': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        'breached': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 animate-pulse',
        'met': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
    }

    const formatTime = (minutes: number) => {
        const absMinutes = Math.abs(minutes)
        const h = Math.floor(absMinutes / 60)
        const m = absMinutes % 60
        return `${minutes < 0 ? '-' : ''}${h}h ${m}m`
    }

    const statusLabel = status === 'breached' ? 'Breached' :
        status === 'at-risk' ? 'At Risk' :
            status === 'met' ? 'Met' : 'On Track'

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between items-center text-xs mb-1.5">
                <span className={cn(
                    "font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide",
                    statusLabelStyles[status]
                )}>
                    {statusLabel}
                </span>
                <span className={cn(
                    "font-mono text-[11px] tabular-nums",
                    status === 'breached' ? "text-red-600 dark:text-red-400 font-semibold" :
                        status === 'at-risk' ? "text-amber-600 dark:text-amber-400" :
                            "text-muted-foreground"
                )}>
                    {formatTime(timeRemaining)} {status === 'breached' ? 'over' : 'left'}
                </span>
            </div>
            <div className={cn(
                "h-2.5 w-full rounded-full overflow-hidden relative",
                statusBgColors[status]
            )}>
                {/* Progress bar */}
                <div
                    className={cn(
                        "h-full transition-all duration-500 rounded-full relative",
                        statusColors[status]
                    )}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                >
                    {/* Shimmer effect for active states */}
                    {(status === 'at-risk' || status === 'breached') && !resolvedDate && (
                        <div className="absolute inset-0 animate-progress-shimmer" />
                    )}
                </div>

                {/* Urgency glow overlay for breached */}
                {status === 'breached' && (
                    <div className="absolute inset-0 rounded-full status-glow-red opacity-50" />
                )}
            </div>
        </div>
    )
})
