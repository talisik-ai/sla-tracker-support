import { Resend } from 'resend'

// Lazy-initialize Resend client to avoid errors on startup if API key is missing
let resendClient: Resend | null = null

function getResendClient(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set. Please add it to your .env.local file.')
        }
        resendClient = new Resend(apiKey)
    }
    return resendClient
}

export interface SLAEmailData {
    issueKey: string
    issueSummary: string
    priority: string
    assignee: string
    alertType: 'at-risk' | 'breached'
    percentageUsed: number
    timeRemaining: string
    jiraUrl: string
}

export async function sendSLAAlertEmail(
    to: string | string[],
    data: SLAEmailData
): Promise<{ success: boolean; error?: string }> {
    try {
        const resend = getResendClient()
        const subject = `${data.alertType === 'breached' ? '🚨 SLA BREACHED' : '⚠️ SLA AT RISK'}: ${data.issueKey}`

        const html = generateEmailHTML(data)

        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        })

        return { success: true }
    } catch (error: any) {
        console.error('[Email] Failed to send SLA alert:', error)
        return { success: false, error: error.message }
    }
}

function generateEmailHTML(data: SLAEmailData): string {
    const statusColor = data.alertType === 'breached' ? '#dc2626' : '#f59e0b'
    const statusText = data.alertType === 'breached' ? 'BREACHED' : 'AT RISK'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 SLA Tracker Alert</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <div style="background-color: ${statusColor}; color: #ffffff; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 18px;">SLA ${statusText}</h2>
                </div>
                
                <h3 style="color: #111; margin-top: 0;">${data.issueKey}: ${data.issueSummary}</h3>
                
                <table width="100%" cellpadding="8" cellspacing="0" style="margin: 20px 0; border-collapse: collapse;">
                    <tr>
                        <td style="border-bottom: 1px solid #e5e5e5; color: #666; padding: 8px 0;">Priority</td>
                        <td style="border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right; padding: 8px 0;">${data.priority}</td>
                    </tr>
                    <tr>
                        <td style="border-bottom: 1px solid #e5e5e5; color: #666; padding: 8px 0;">Assignee</td>
                        <td style="border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right; padding: 8px 0;">${data.assignee}</td>
                    </tr>
                    <tr>
                        <td style="border-bottom: 1px solid #e5e5e5; color: #666; padding: 8px 0;">Time Used</td>
                        <td style="border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right; padding: 8px 0; color: ${statusColor};">${data.percentageUsed}%</td>
                    </tr>
                    <tr>
                        <td style="color: #666; padding: 8px 0;">Time Remaining</td>
                        <td style="font-weight: 600; text-align: right; padding: 8px 0;">${data.timeRemaining}</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.jiraUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View in Jira</a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                    This is an automated alert from the Jira SLA Tracker. Please take action to resolve this issue promptly.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}
