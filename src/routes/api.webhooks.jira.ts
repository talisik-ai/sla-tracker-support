import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eventBroadcaster } from '@/lib/events/broadcaster'

export const Route = createFileRoute('/api/webhooks/jira')({
    component: () => null,
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json()

                    console.log('[Webhook] Received Jira webhook:', {
                        eventType: body.webhookEvent,
                        issueKey: body.issue?.key,
                        timestamp: new Date().toISOString()
                    })

                    // Validate webhook secret (optional but recommended)
                    // Note: Jira Automation webhooks don't send X-Atlassian-Webhook-Identifier
                    // Uncomment this if using programmatic webhooks with secrets
                    /*
                    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET
                    if (webhookSecret) {
                        const providedSecret = request.headers.get('X-Atlassian-Webhook-Identifier')
                        if (providedSecret !== webhookSecret) {
                            console.warn('[Webhook] Invalid webhook secret')
                            return json({ error: 'Unauthorized' }, { status: 401 })
                        }
                    }
                    */

                    // Process different webhook event types
                    const eventType = body.webhookEvent
                    const issue = body.issue

                    if (!issue) {
                        console.warn('[Webhook] No issue data in webhook payload')
                        return json({ error: 'Invalid payload' }, { status: 400 })
                    }

                    // Broadcast event to all connected clients
                    switch (eventType) {
                        case 'jira:issue_created':
                            eventBroadcaster.broadcast('issue-created', {
                                issueKey: issue.key,
                                issue: issue,
                                timestamp: Date.now()
                            })
                            break

                        case 'jira:issue_updated':
                            eventBroadcaster.broadcast('issue-updated', {
                                issueKey: issue.key,
                                issue: issue,
                                changelog: body.changelog,
                                timestamp: Date.now()
                            })
                            break

                        case 'jira:issue_deleted':
                            eventBroadcaster.broadcast('issue-deleted', {
                                issueKey: issue.key,
                                issueId: issue.id,
                                timestamp: Date.now()
                            })
                            break

                        default:
                            console.log('[Webhook] Unhandled event type:', eventType)
                    }

                    console.log(`[Webhook] Broadcasted ${eventType} to ${eventBroadcaster.getClientCount()} clients`)

                    return json({ success: true, received: true })

                } catch (error: any) {
                    console.error('[Webhook] Error processing webhook:', error)
                    return json({ error: error.message }, { status: 500 })
                }
            }
        }
    }
})
