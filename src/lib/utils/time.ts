/**
 * Format elapsed time in a human-readable format
 * Shows seconds for < 1 minute, minutes for < 1 hour, hours and minutes for >= 1 hour
 */
export function formatElapsedTime(minutes: number): string {
    const absMinutes = Math.abs(minutes)

    // Less than 1 minute - show seconds
    if (absMinutes < 1) {
        const seconds = Math.round(absMinutes * 60)
        return `${seconds} second${seconds !== 1 ? 's' : ''}`
    }

    // Less than 1 hour - show minutes
    if (absMinutes < 60) {
        const mins = Math.round(absMinutes)
        return `${mins} minute${mins !== 1 ? 's' : ''}`
    }

    // 1 hour or more - show hours and minutes
    const hours = Math.floor(absMinutes / 60)
    const mins = Math.round(absMinutes % 60)

    if (mins === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`
    }

    return `${hours}h ${mins}m`
}

/**
 * Format remaining time in a human-readable format
 * Shows seconds for < 1 minute, minutes for < 1 hour, hours and minutes for >= 1 hour
 */
export function formatRemainingTime(minutes: number): string {
    const absMinutes = Math.abs(minutes)
    const isNegative = minutes < 0

    // Less than 1 minute
    if (absMinutes < 1) {
        const seconds = Math.round(absMinutes * 60)
        return isNegative
            ? `Overdue by ${seconds} second${seconds !== 1 ? 's' : ''}`
            : `${seconds} second${seconds !== 1 ? 's' : ''} remaining`
    }

    // Less than 1 hour - show minutes
    if (absMinutes < 60) {
        const mins = Math.round(absMinutes)
        return isNegative
            ? `Overdue by ${mins} minute${mins !== 1 ? 's' : ''}`
            : `${mins} minute${mins !== 1 ? 's' : ''} remaining`
    }

    // 1 hour or more - show hours and minutes
    const hours = Math.floor(absMinutes / 60)
    const mins = Math.round(absMinutes % 60)

    const timeStr = mins === 0
        ? `${hours} hour${hours !== 1 ? 's' : ''}`
        : `${hours}h ${mins}m`

    return isNegative ? `Overdue by ${timeStr}` : `${timeStr} remaining`
}
