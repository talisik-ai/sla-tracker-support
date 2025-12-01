import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    title: string
    value: number | string
    status?: 'critical' | 'warning' | 'success' | 'neutral'
    icon?: React.ReactNode
    trend?: {
        direction: 'up' | 'down'
        percentage: number
    }
    className?: string
    onClick?: () => void
    /** Animation stagger index (1-6) for page load */
    staggerIndex?: number
}

export function MetricCard({
    title,
    value,
    status = 'neutral',
    icon,
    trend,
    className,
    onClick,
    staggerIndex
}: MetricCardProps) {
    const statusColors = {
        critical: "text-red-600 dark:text-red-500",
        warning: "text-amber-600 dark:text-amber-500",
        success: "text-green-600 dark:text-green-500",
        neutral: "text-foreground"
    }

    const statusCardStyles = {
        critical: "metric-card-critical animate-urgent-pulse",
        warning: "metric-card-warning",
        success: "metric-card-success",
        neutral: ""
    }

    const iconStatusColors = {
        critical: "text-red-500",
        warning: "text-amber-500",
        success: "text-green-500",
        neutral: "text-muted-foreground"
    }

    // Use inline style for animation delay and visibility fallback
    const animationStyle = staggerIndex ? {
        animationDelay: `${staggerIndex * 50}ms`,
        opacity: 1, // Fallback to ensure visibility if CSS animation fails
    } : {}

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                "relative",
                onClick && "cursor-pointer active:scale-[0.98]",
                statusCardStyles[status],
                staggerIndex && "animate-slide-up",
                className
            )}
            style={animationStyle}
            onClick={onClick}
        >
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] dark:to-white/[0.02] pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide uppercase text-[11px]">
                    {title}
                </CardTitle>
                {icon && (
                    <div className={cn(
                        "transition-colors",
                        iconStatusColors[status]
                    )}>
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative">
                <div className={cn(
                    "text-3xl font-bold tracking-tight font-mono tabular-nums",
                    statusColors[status],
                    status === 'critical' && "animate-number-glow"
                )}>
                    {value}
                </div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <span className={cn(
                            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                            trend.direction === 'up'
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
                        </span>
                        <span className="text-muted-foreground/70">vs last period</span>
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
