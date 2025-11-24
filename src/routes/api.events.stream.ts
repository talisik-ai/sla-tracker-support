import { createFileRoute } from '@tanstack/react-router'
import { eventBroadcaster } from '@/lib/events/broadcaster'

export const Route = createFileRoute('/api/events/stream')({
    component: () => null,
    server: {
        handlers: {
            GET: async () => {
                const clientId = crypto.randomUUID()
                let heartbeatInterval: NodeJS.Timeout | null = null

                const stream = new ReadableStream({
                    start(controller) {
                        // Add client to broadcaster
                        const client = eventBroadcaster.addClient(clientId, controller)

                        // Send initial connection message
                        try {
                            client.send('connected', { clientId, timestamp: Date.now() })
                        } catch (error) {
                            console.error('[SSE] Failed to send initial message:', error)
                        }

                        // Send heartbeat every 30 seconds to keep connection alive
                        heartbeatInterval = setInterval(() => {
                            try {
                                // Check if controller is still usable
                                if (controller.desiredSize !== null) {
                                    client.send('heartbeat', { timestamp: Date.now() })
                                } else {
                                    // Controller is closed, clean up
                                    if (heartbeatInterval) {
                                        clearInterval(heartbeatInterval)
                                        heartbeatInterval = null
                                    }
                                    eventBroadcaster.removeClient(clientId)
                                }
                            } catch (error) {
                                console.error('[SSE] Heartbeat error, cleaning up:', error)
                                if (heartbeatInterval) {
                                    clearInterval(heartbeatInterval)
                                    heartbeatInterval = null
                                }
                                eventBroadcaster.removeClient(clientId)
                            }
                        }, 30000)
                    },
                    cancel() {
                        if (heartbeatInterval) {
                            clearInterval(heartbeatInterval)
                            heartbeatInterval = null
                        }
                        eventBroadcaster.removeClient(clientId)
                    }
                })

                return new Response(stream, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                })
            }
        }
    }
})
