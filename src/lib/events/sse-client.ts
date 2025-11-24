/**
 * Client-side SSE connection manager
 */

export type SSEEventHandler = (data: any) => void

export interface SSEEventHandlers {
    'issue-created'?: SSEEventHandler
    'issue-updated'?: SSEEventHandler
    'issue-deleted'?: SSEEventHandler
    'connected'?: SSEEventHandler
    'heartbeat'?: SSEEventHandler
}

export class SSEClient {
    private eventSource: EventSource | null = null
    private handlers: SSEEventHandlers = {}
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000

    constructor(private url: string) { }

    connect(handlers: SSEEventHandlers) {
        this.handlers = handlers

        try {
            this.eventSource = new EventSource(this.url)

            this.eventSource.onopen = () => {
                console.log('[SSE Client] Connected to event stream')
                this.reconnectAttempts = 0
            }

            this.eventSource.onerror = (error) => {
                console.error('[SSE Client] Connection error:', error)
                this.handleReconnect()
            }

            // Register event handlers
            Object.entries(this.handlers).forEach(([event, handler]) => {
                if (handler && this.eventSource) {
                    this.eventSource.addEventListener(event, (e: MessageEvent) => {
                        try {
                            const data = JSON.parse(e.data)
                            handler(data)
                        } catch (error) {
                            console.error(`[SSE Client] Error parsing ${event} event:`, error)
                        }
                    })
                }
            })

        } catch (error) {
            console.error('[SSE Client] Failed to create EventSource:', error)
            this.handleReconnect()
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[SSE Client] Max reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

        console.log(`[SSE Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

        setTimeout(() => {
            this.disconnect()
            this.connect(this.handlers)
        }, delay)
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
            console.log('[SSE Client] Disconnected from event stream')
        }
    }

    isConnected(): boolean {
        return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
    }
}
