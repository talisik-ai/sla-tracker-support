import * as React from "react"
import { cn } from "@/lib/utils"
import { differenceInMinutes } from "date-fns"

interface SLATimerProps {
    deadlineHours: number
    createdDate: Date
    resolvedDate?: Date | null
    className?: string
}

export function SLATimer({
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

    let status: 'on-track' | 'at-risk' | 'breached' = 'on-track'
    if (percentageUsed >= 100) status = 'breached'
    else if (percentageUsed >= 75) status = 'at-risk'

    const statusColors = {
        'on-track': 'bg-green-500',
        'at-risk': 'bg-amber-500',
        'breached': 'bg-red-500'
    }

    const formatTime = (minutes: number) => {
        const absMinutes = Math.abs(minutes)
        const h = Math.floor(absMinutes / 60)
        const m = absMinutes % 60
        return `${minutes < 0 ? '-' : ''}${h}h ${m}m`
    }

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between text-xs mb-1">
                <span className={cn(
                    "font-medium",
                    status === 'breached' ? "text-red-600" :
                        status === 'at-risk' ? "text-amber-600" : "text-green-600"
                )}>
                    {status === 'breached' ? 'Breached' :
                        status === 'at-risk' ? 'At Risk' : 'On Track'}
                </span>
                <span className="text-muted-foreground">
                    {formatTime(timeRemaining)} left
                </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500", statusColors[status])}
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                />
            </div>
        </div>
    )
}
