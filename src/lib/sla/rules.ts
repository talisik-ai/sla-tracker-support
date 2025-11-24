export interface SLARule {
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    firstResponseHours: number;
    resolutionHours: number;
    resolutionWithDependenciesHours: number;
    businessHoursOnly: boolean;
}

// Map Jira priority names to our SLA priority levels
export const PRIORITY_MAPPING: Record<string, string> = {
    'Highest': 'Critical',
    'Critical': 'Critical',
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
    'Lowest': 'Low',
};

export const SLA_RULES: Record<string, SLARule> = {
    'Critical': {
        priority: 'Critical',
        firstResponseHours: 2,
        resolutionHours: 8,
        resolutionWithDependenciesHours: 24,
        businessHoursOnly: false, // 24/7
    },
    'High': {
        priority: 'High',
        firstResponseHours: 2, // business hours, 4 after hours
        resolutionHours: 24,
        resolutionWithDependenciesHours: 48,
        businessHoursOnly: false, // monitored 24/7
    },
    'Medium': {
        priority: 'Medium',
        firstResponseHours: 4,
        resolutionHours: 48,
        resolutionWithDependenciesHours: 72,
        businessHoursOnly: true,
    },
    'Low': {
        priority: 'Low',
        firstResponseHours: 8,
        resolutionHours: 120, // 5 days
        resolutionWithDependenciesHours: 240, // 10 days
        businessHoursOnly: true,
    },
};

export const BUSINESS_HOURS = {
    timezone: 'Asia/Manila',
    startHour: 8,  // 8 AM
    endHour: 18,   // 6 PM
    weekdays: [1, 2, 3, 4, 5], // Monday - Friday
};

// Philippine public holidays 2025
export const HOLIDAYS_2025 = [
    '2025-01-01', // New Year
    '2025-04-09', // Araw ng Kagitingan
    '2025-04-17', // Maundy Thursday
    '2025-04-18', // Good Friday
    '2025-05-01', // Labor Day
    '2025-06-12', // Independence Day
    '2025-08-25', // Ninoy Aquino Day
    '2025-08-31', // National Heroes Day
    '2025-11-30', // Bonifacio Day
    '2025-12-25', // Christmas
    '2025-12-30', // Rizal Day
    '2025-12-31', // New Year's Eve
];
