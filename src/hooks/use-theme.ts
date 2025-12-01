import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('theme') as Theme) || 'system'
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

    if (effectiveTheme === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())
    const [mounted, setMounted] = useState(false)

    // Apply theme on mount and when theme changes
    useEffect(() => {
        setMounted(true)
        applyTheme(theme)
    }, [theme])

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => applyTheme('system')

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const setTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem('theme', newTheme)
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        const currentEffective = theme === 'system' ? getSystemTheme() : theme
        const newTheme = currentEffective === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
    }, [theme, setTheme])

    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

    return {
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        mounted,
        isDark: effectiveTheme === 'dark'
    }
}
