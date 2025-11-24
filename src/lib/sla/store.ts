import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SLA_RULES, BUSINESS_HOURS, HOLIDAYS_2025, SLARule } from './rules'

export interface SLASettings {
    rules: Record<string, SLARule>
    businessHours: typeof BUSINESS_HOURS
    holidays: string[]
    projectKey: string
}

interface SLAStore extends SLASettings {
    updateRule: (priority: string, rule: Partial<SLARule>) => void
    updateBusinessHours: (hours: Partial<typeof BUSINESS_HOURS>) => void
    addHoliday: (date: string) => void
    removeHoliday: (date: string) => void
    setProjectKey: (key: string) => void
    exportSettings: () => string
    importSettings: (json: string) => boolean
    resetSettings: () => void
}

const DEFAULT_SETTINGS: SLASettings = {
    rules: SLA_RULES,
    businessHours: BUSINESS_HOURS,
    holidays: HOLIDAYS_2025,
    projectKey: import.meta.env.VITE_JIRA_PROJECT_KEY || 'SD',
}

export const useSLAStore = create<SLAStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,

            updateRule: (priority, rule) =>
                set((state) => ({
                    rules: {
                        ...state.rules,
                        [priority]: { ...state.rules[priority], ...rule },
                    },
                })),

            updateBusinessHours: (hours) =>
                set((state) => ({
                    businessHours: { ...state.businessHours, ...hours },
                })),

            addHoliday: (date) =>
                set((state) => ({
                    holidays: [...state.holidays, date].sort(),
                })),

            removeHoliday: (date) =>
                set((state) => ({
                    holidays: state.holidays.filter((h) => h !== date),
                })),

            setProjectKey: (key) =>
                set(() => ({
                    projectKey: key.trim().toUpperCase(),
                })),

            exportSettings: () => {
                const state = get()
                return JSON.stringify({
                    rules: state.rules,
                    businessHours: state.businessHours,
                    holidays: state.holidays,
                    projectKey: state.projectKey,
                }, null, 2)
            },

            importSettings: (json: string) => {
                try {
                    const settings = JSON.parse(json)
                    set({
                        rules: settings.rules || DEFAULT_SETTINGS.rules,
                        businessHours: settings.businessHours || DEFAULT_SETTINGS.businessHours,
                        holidays: settings.holidays || DEFAULT_SETTINGS.holidays,
                        projectKey: settings.projectKey || DEFAULT_SETTINGS.projectKey,
                    })
                    return true
                } catch (error) {
                    console.error('Failed to import settings:', error)
                    return false
                }
            },

            resetSettings: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'sla-settings-storage',
            partialize: (state) => ({
                rules: state.rules,
                businessHours: state.businessHours,
                holidays: state.holidays,
                projectKey: state.projectKey,
            }),
        }
    )
)
