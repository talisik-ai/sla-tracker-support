import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { sendSLAAlertEmail, SLAEmailData } from '@/lib/email/client'

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

                    if (!body.to || !body.data) {
                        return json({ error: 'Missing required fields' }, { status: 400 })
                    }

                    const result = await sendSLAAlertEmail(body.to, body.data)

                    if (result.success) {
                        console.log('[Email API] Email sent successfully')
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
