import { describe, it, expect } from 'vitest'
import { calculateSLA } from './calculator'
import { SLA_RULES } from './rules'
import type { JiraIssue } from '../jira/types'

// Helper to create a mock Jira issue
function createMockIssue(overrides: Partial<JiraIssue> = {}): JiraIssue {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    
    return {
        id: '10001',
        key: 'TEST-1',
        fields: {
            summary: 'Test Issue',
            description: 'Test description',
            status: {
                name: 'In Progress',
                statusCategory: {
                    key: 'indeterminate',
                    name: 'In Progress'
                }
            },
            priority: {
                name: 'High',
                iconUrl: ''
            },
            issuetype: {
                name: 'Task',
                iconUrl: ''
            },
            assignee: {
                accountId: '123',
                displayName: 'Test User',
                avatarUrls: { '48x48': '' }
            },
            reporter: {
                accountId: '123',
                displayName: 'Test Reporter'
            },
            created: twoHoursAgo.toISOString(),
            updated: now.toISOString(),
            resolutiondate: null,
            components: [],
            labels: [],
            comment: {
                comments: []
            },
            project: {
                key: 'TEST',
                name: 'Test Project'
            }
        },
        ...overrides
    } as JiraIssue
}

describe('SLA Calculator', () => {
    describe('Critical Priority Issues', () => {
        it('should mark Critical issue as breached after 2 hours without response', () => {
            // Arrange: Create an issue that's 3 hours old with no comments
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: threeHoursAgo.toISOString(),
                    comment: { comments: [] } // No first response
                }
            })

            // Act: Calculate SLA
            const sla = calculateSLA(issue)

            // Assert: Should be breached (Critical first response SLA is 2 hours)
            expect(sla.priority).toBe('Critical')
            expect(sla.hasFirstResponse).toBe(false)
            expect(sla.firstResponseStatus).toBe('breached')
            expect(sla.firstResponsePercentageUsed).toBeGreaterThan(100)
        })

        it('should mark Critical issue as on-track within 2 hour response window', () => {
            // Arrange: Create an issue that's 1 hour old
            const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: oneHourAgo.toISOString(),
                    comment: { comments: [] }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Should be on-track (under 75% of 2 hours)
            expect(sla.firstResponseStatus).toBe('on-track')
            expect(sla.firstResponsePercentageUsed).toBeLessThan(75)
            expect(sla.isBreached).toBe(false)
        })

        it('should mark Critical issue as at-risk between 75-100% of SLA time', () => {
            // Arrange: Create an issue that's 1.5 hours old (75% of 2 hour SLA)
            const minutesElapsed = 90 // 1.5 hours = 75% of 2 hour SLA
            const createdDate = new Date(Date.now() - minutesElapsed * 60 * 1000)
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: createdDate.toISOString(),
                    comment: { comments: [] }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Should be at-risk (75%+)
            expect(sla.firstResponseStatus).toBe('at-risk')
            expect(sla.firstResponsePercentageUsed).toBeGreaterThanOrEqual(75)
            expect(sla.firstResponsePercentageUsed).toBeLessThan(100)
        })
    })

    describe('Resolution SLA', () => {
        it('should calculate resolution SLA for High priority correctly', () => {
            // Arrange: High priority has 24 hour resolution SLA
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'High', iconUrl: '' },
                    created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert
            expect(sla.resolutionDeadline).toBe(SLA_RULES['High'].resolutionHours)
            expect(sla.resolutionDeadline).toBe(24)
            expect(sla.resolutionPercentageUsed).toBeGreaterThan(45) // ~50%
            expect(sla.resolutionPercentageUsed).toBeLessThan(55)
            expect(sla.resolutionStatus).toBe('on-track')
        })

        it('should mark resolved issues as met when within SLA', () => {
            // Arrange: Issue resolved in 1 hour (within 2 hour Critical SLA)
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
            
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: twoHoursAgo.toISOString(),
                    resolutiondate: oneHourAgo.toISOString(),
                    status: {
                        name: 'Done',
                        statusCategory: {
                            key: 'done',
                            name: 'Done'
                        }
                    }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Resolved in 1 hour, Critical resolution SLA is 8 hours
            expect(sla.isResolved).toBe(true)
            expect(sla.resolutionStatus).toBe('met')
            expect(sla.resolutionPercentageUsed).toBeLessThan(100)
        })

        it('should mark resolved issues as breached when outside SLA', () => {
            // Arrange: Issue took 10 hours to resolve (breached 8 hour Critical SLA)
            const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000)
            const now = new Date()
            
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: tenHoursAgo.toISOString(),
                    resolutiondate: now.toISOString(),
                    status: {
                        name: 'Done',
                        statusCategory: {
                            key: 'done',
                            name: 'Done'
                        }
                    }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert
            expect(sla.isResolved).toBe(true)
            expect(sla.resolutionStatus).toBe('breached')
            expect(sla.resolutionPercentageUsed).toBeGreaterThan(100)
        })
    })

    describe('First Response Tracking', () => {
        it('should detect first response from comments', () => {
            // Arrange
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
            
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    created: twoHoursAgo.toISOString(),
                    comment: {
                        comments: [
                            {
                                id: '1',
                                author: { displayName: 'Responder' },
                                body: 'Working on it',
                                created: oneHourAgo.toISOString()
                            }
                        ]
                    }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert
            expect(sla.hasFirstResponse).toBe(true)
            expect(sla.firstResponseDate).toEqual(oneHourAgo)
            expect(sla.firstResponseStatus).toBe('met')
        })

        it('should calculate time to first response correctly', () => {
            // Arrange: Issue created 2 hours ago, responded 1 hour ago
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
            
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    created: twoHoursAgo.toISOString(),
                    comment: {
                        comments: [
                            {
                                id: '1',
                                author: { displayName: 'Responder' },
                                body: 'Response',
                                created: oneHourAgo.toISOString()
                            }
                        ]
                    }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Response was 1 hour (60 minutes) after creation
            expect(sla.firstResponseTimeElapsed).toBeGreaterThan(55)
            expect(sla.firstResponseTimeElapsed).toBeLessThan(65)
        })
    })

    describe('Edge Cases', () => {
        it('should handle missing project key gracefully', () => {
            // Arrange
            const issue = createMockIssue()

            // Act
            const sla = calculateSLA(issue)

            // Assert: Should still calculate SLA
            expect(sla).toBeDefined()
            expect(sla.issueKey).toBe('TEST-1')
        })

        it('should use fallback for unknown priority', () => {
            // Arrange: Unknown priority
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Unknown Priority', iconUrl: '' }
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Should fall back to Medium priority rules
            expect(sla).toBeDefined()
            expect(sla.resolutionDeadline).toBe(SLA_RULES['Medium'].resolutionHours)
        })

        it('should determine overall status as worst of first response and resolution', () => {
            // Arrange: First response met, but resolution breached
            const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000)
            const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000)
            
            const issue = createMockIssue({
                fields: {
                    ...createMockIssue().fields,
                    priority: { name: 'Critical', iconUrl: '' },
                    created: tenHoursAgo.toISOString(),
                    comment: {
                        comments: [{
                            id: '1',
                            author: { displayName: 'Test' },
                            body: 'Response',
                            created: nineHoursAgo.toISOString() // Responded within 1 hour (met)
                        }]
                    }
                    // Still open after 10 hours (breached 8 hour resolution SLA)
                }
            })

            // Act
            const sla = calculateSLA(issue)

            // Assert: Overall status should be 'breached' (worst status)
            expect(sla.firstResponseStatus).toBe('met')
            expect(sla.resolutionStatus).toBe('breached')
            expect(sla.overallStatus).toBe('breached')
            expect(sla.isBreached).toBe(true)
        })
    })

    describe('SLA Rules Compliance', () => {
        it('should use correct SLA times for each priority', () => {
            const priorities: Array<'Critical' | 'High' | 'Medium' | 'Low'> = ['Critical', 'High', 'Medium', 'Low']
            
            priorities.forEach(priority => {
                // Arrange
                const issue = createMockIssue({
                    fields: {
                        ...createMockIssue().fields,
                        priority: { name: priority, iconUrl: '' }
                    }
                })

                // Act
                const sla = calculateSLA(issue)
                const rules = SLA_RULES[priority]

                // Assert
                expect(sla.firstResponseDeadline).toBe(rules.firstResponseHours)
                expect(sla.resolutionDeadline).toBe(rules.resolutionHours)
            })
        })
    })
})

