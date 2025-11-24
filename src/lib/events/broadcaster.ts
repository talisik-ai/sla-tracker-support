/**
 * Server-Sent Events (SSE) Event Broadcaster
 * Manages connected clients and broadcasts events
 */

export interface SSEClient {
    id: string
    controller: ReadableStreamDefaultController
    send: (event: string, data: any) => void
}

class EventBroadcaster {
    private clients: Map<string, SSEClient> = new Map()

    addClient(id: string, controller: ReadableStreamDefaultController): SSEClient {
        const encoder = new TextEncoder()

        const client: SSEClient = {
            id,
            controller,
            send: (event: string, data: any) => {
                const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                try {
                    // Check if controller is still open
                    if (controller.desiredSize !== null) {
                        controller.enqueue(encoder.encode(message))
                    }
                } catch (error) {
                    console.error(`[SSE] Failed to send to client ${id}:`, error)
                    this.removeClient(id)
                }
            }
        }

        this.clients.set(id, client)
        console.log(`[SSE] Client connected: ${id}. Total clients: ${this.clients.size}`)

        return client
    }

    removeClient(id: string) {
        if (this.clients.has(id)) {
            this.clients.delete(id)
            console.log(`[SSE] Client disconnected: ${id}. Total clients: ${this.clients.size}`)
        }
    }

    broadcast(event: string, data: any) {
        console.log(`[SSE] Broadcasting ${event} to ${this.clients.size} clients`)
        this.clients.forEach((client) => {
            client.send(event, data)
        })
    }

    getClientCount(): number {
        return this.clients.size
    }
}

// Singleton instance
export const eventBroadcaster = new EventBroadcaster()
