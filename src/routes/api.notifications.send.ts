import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { sendSLAAlertEmail, SLAEmailData } from '@/lib/email/client'

// ============================================
// Rate Limiting Implementation
// ============================================

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory rate limit store (per recipient)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_EMAILS_PER_WINDOW = 10 // Max 10 emails per hour per recipient
const MAX_EMAILS_PER_ISSUE = 2 // Max 2 emails per issue (at-risk + breached)

// Track emails sent per issue
const issueEmailCount = new Map<string, number>()

function isRateLimited(recipient: string, issueKey: string): { limited: boolean; reason?: string } {
    const now = Date.now()
    
    // Check per-recipient rate limit
    const recipientKey = recipient.toLowerCase()
    const entry = rateLimitStore.get(recipientKey)
    
    if (entry) {
        if (now > entry.resetTime) {
            // Window expired, reset
            rateLimitStore.set(recipientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        } else if (entry.count >= MAX_EMAILS_PER_WINDOW) {
            return { 
                limited: true, 
                reason: `Rate limit exceeded: ${MAX_EMAILS_PER_WINDOW} emails per hour for ${recipient}` 
            }
        } else {
            entry.count++
        }
    } else {
        rateLimitStore.set(recipientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    }
    
    // Check per-issue limit
    const issueCount = issueEmailCount.get(issueKey) || 0
    if (issueCount >= MAX_EMAILS_PER_ISSUE) {
        return { 
            limited: true, 
            reason: `Issue ${issueKey} has already received ${MAX_EMAILS_PER_ISSUE} email notifications` 
        }
    }
    issueEmailCount.set(issueKey, issueCount + 1)
    
    return { limited: false }
}

// Clean up old rate limit entries periodically
function cleanupRateLimitStore() {
    const now = Date.now()
    rateLimitStore.forEach((entry, key) => {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key)
        }
    })
    
    // Clean up issue email counts older than 24 hours
    // (In production, this would use a proper cache with TTL)
    if (issueEmailCount.size > 1000) {
        issueEmailCount.clear()
    }
}

// Run cleanup every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000)

// ============================================
// API Route
// ============================================

export const Route = createFileRoute('/api/notifications/send')({
    component: () => null,
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    console.log('[Email API] Received email send request')

                    const body = await request.json() as {
                        to: string | string[]
                        data: SLAEmailData
                    }

                    // Validate required fields
                    if (!body.to || !body.data) {
                        return json({ error: 'Missing required fields' }, { status: 400 })
                    }

                    if (!body.data.issueKey) {
                        return json({ error: 'Missing issue key' }, { status: 400 })
                    }

                    // Normalize recipient to array
                    const recipients = Array.isArray(body.to) ? body.to : [body.to]
                    
                    // Check rate limit for each recipient
                    for (const recipient of recipients) {
                        const { limited, reason } = isRateLimited(recipient, body.data.issueKey)
                        if (limited) {
                            console.warn(`[Email API] Rate limited: ${reason}`)
                            return json({ 
                                error: 'Rate limit exceeded', 
                                message: reason 
                            }, { status: 429 })
                        }
                    }

                    // Send email
                    const result = await sendSLAAlertEmail(body.to, body.data)

                    if (result.success) {
                        console.log(`[Email API] Email sent successfully to ${recipients.join(', ')} for ${body.data.issueKey}`)
                        return json({ success: true })
                    } else {
                        console.error('[Email API] Email sending failed:', result.error)
                        return json({ error: result.error }, { status: 500 })
                    }
                } catch (error: any) {
                    console.error('[Email API] Request error:', error)
                    return json({ error: error.message }, { status: 500 })
                }
            }
        }
    }
})
