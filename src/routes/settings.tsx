import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSLAStore } from '@/lib/sla/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
    ArrowTurnBackwardIcon, 
    PlusSignIcon, 
    Delete02Icon, 
    Calendar01Icon, 
    RefreshIcon, 
    CheckmarkCircle01Icon, 
    AlertCircleIcon, 
    Notification01Icon, 
    Mail01Icon, 
    VolumeHighIcon, 
    Moon02Icon 
} from '@hugeicons/core-free-icons'
import { bulkSyncSLAToJira, getSyncSummary, type SyncResult } from '@/lib/jira/sla-sync'
import { getAllProjectIssues } from '@/lib/jira/api'
import { calculateSLA } from '@/lib/sla/calculator'
import { JIRA_CUSTOM_FIELDS } from '@/lib/jira/custom-fields'
import { getNotificationSettings, saveNotificationSettings, playNotificationSound, type NotificationSettings } from '@/lib/notifications/helpers'
import { useNotificationStore } from '@/lib/notifications/store'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
})

function SettingsPage() {
    const {
        rules,
        businessHours,
        holidays,
        projectKey,
        updateRule,
        updateBusinessHours,
        addHoliday,
        removeHoliday,
        setProjectKey,
        exportSettings,
        importSettings,
        resetSettings
    } = useSLAStore()

    const [newHoliday, setNewHoliday] = React.useState('')
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Notification Settings State
    const [notifSettings, setNotifSettings] = React.useState<NotificationSettings>(() => getNotificationSettings())
    const { clearNotifications, notifications } = useNotificationStore()

    // Load notification settings on mount
    React.useEffect(() => {
        setNotifSettings(getNotificationSettings())
    }, [])

    const updateNotifSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
        const updated = { ...notifSettings, [key]: value }
        setNotifSettings(updated)
        saveNotificationSettings({ [key]: value })
        
        // Play test sound when enabling
        if (key === 'soundEnabled' && value === true) {
            playNotificationSound('info')
        }
    }

    // Bulk Sync State
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [syncProgress, setSyncProgress] = React.useState(0)
    const [syncStatus, setSyncStatus] = React.useState('')
    const [syncResults, setSyncResults] = React.useState<{
        total: number
        successful: number
        failed: number
        errors: Array<{ issueKey: string; error: string }>
    } | null>(null)

    const handleAddHoliday = () => {
        if (newHoliday) {
            addHoliday(newHoliday)
            setNewHoliday('')
        }
    }

    const handleExport = () => {
        const json = exportSettings()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sla-settings-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Import result state for dialog
    const [importResult, setImportResult] = React.useState<{ success: boolean; message: string } | null>(null)

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            file.text().then((text) => {
                const success = importSettings(text)
                if (success) {
                    setImportResult({ success: true, message: 'Settings imported successfully!' })
                } else {
                    setImportResult({ success: false, message: 'Failed to import settings. Please check the file format.' })
                }
            })
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleBulkSync = async () => {
        setIsSyncing(true)
        setSyncProgress(0)
        setSyncStatus('Fetching issues...')
        setSyncResults(null)

        try {
            // 1. Fetch all issues
            const issues = await getAllProjectIssues(projectKey)
            setSyncStatus(`Found ${issues.length} issues. Calculating SLA...`)

            // 2. Calculate SLA for all issues
            const issuesWithSLA = issues.map(issue => ({
                issueKey: issue.key,
                sla: calculateSLA(issue, { rules, businessHours, holidays, projectKey })
            }))

            // 3. Perform Bulk Sync
            setSyncStatus('Syncing to Jira...')
            const results = await bulkSyncSLAToJira(issuesWithSLA, (current, total, issueKey) => {
                setSyncProgress(Math.round((current / total) * 100))
                setSyncStatus(`Syncing ${current}/${total}: ${issueKey}`)
            })

            // 4. Show Summary
            const summary = getSyncSummary(results)
            setSyncResults(summary)
            setSyncStatus('Sync complete!')

        } catch (error: any) {
            console.error('Bulk sync failed:', error)
            setSyncStatus(`Error: ${error.message}`)
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground">Configure SLA rules, business hours, and holidays</p>
                </div>
                <Button variant="outline" onClick={resetSettings} className="text-destructive hover:text-destructive">
                    <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} className="mr-2" />
                    Reset to Defaults
                </Button>
            </div>

            {/* SLA Rules Configuration */}
            <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold">SLA Rules by Priority</h2>
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
                    {Object.entries(rules).map(([priority, rule]) => (
                        <Card key={priority}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Badge variant={
                                            priority === 'Critical' ? 'destructive' :
                                                priority === 'High' ? 'default' :
                                                    priority === 'Medium' ? 'secondary' : 'outline'
                                        }>
                                            {priority}
                                        </Badge>
                                        Priority
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${priority}-response`}>Response Time (Hours)</Label>
                                        <Input
                                            id={`${priority}-response`}
                                            type="number"
                                            value={rule.firstResponseHours}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(priority, { firstResponseHours: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`${priority}-resolution`}>Resolution Time (Hours)</Label>
                                        <Input
                                            id={`${priority}-resolution`}
                                            type="number"
                                            value={rule.resolutionHours}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(priority, { resolutionHours: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor={`${priority}-business-hours`} className="flex flex-col gap-1">
                                        <span>Business Hours Only</span>
                                        <span className="font-normal text-xs text-muted-foreground">
                                            {rule.businessHoursOnly ? 'Count only working hours' : 'Count 24/7 (weekends included)'}
                                        </span>
                                    </Label>
                                    <Switch
                                        id={`${priority}-business-hours`}
                                        checked={rule.businessHoursOnly}
                                        onCheckedChange={(checked: boolean) => updateRule(priority, { businessHoursOnly: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Project Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Jira Project</CardTitle>
                    <CardDescription>
                        The Jira project key to track for SLA compliance
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-key">Project Key</Label>
                        <Input
                            id="project-key"
                            placeholder="e.g., SUPPORT, BUGS, SD"
                            value={projectKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectKey(e.target.value)}
                            className="uppercase"
                        />
                        <p className="text-xs text-muted-foreground">
                            The tracker will fetch and monitor issues from this Jira project.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Jira Integration & Bulk Sync */}
            <Card>
                <CardHeader>
                    <CardTitle>Jira Integration</CardTitle>
                    <CardDescription>
                        Manage synchronization with Jira custom fields
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Custom Fields Info */}
                    <div className="space-y-2">
                        <Label>Configured Custom Fields</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-muted rounded-md">
                                <span className="block font-medium text-xs text-muted-foreground">SLA Due Date</span>
                                <code className="text-xs">{JIRA_CUSTOM_FIELDS.SLA_DUE_DATE}</code>
                            </div>
                            <div className="p-3 bg-muted rounded-md">
                                <span className="block font-medium text-xs text-muted-foreground">SLA Status</span>
                                <code className="text-xs">{JIRA_CUSTOM_FIELDS.SLA_STATUS}</code>
                            </div>
                            <div className="p-3 bg-muted rounded-md">
                                <span className="block font-medium text-xs text-muted-foreground">Time Used %</span>
                                <code className="text-xs">{JIRA_CUSTOM_FIELDS.SLA_TIME_USED}</code>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            These IDs are configured in your environment variables.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Bulk Sync</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Calculate SLA status for all issues in project <strong>{projectKey}</strong> and update their custom fields in Jira.
                            This is useful for backfilling data or updating after changing SLA rules.
                        </p>

                        {!isSyncing && !syncResults && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full md:w-auto">
                                        <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
                                        Sync All Issues to Jira
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will calculate SLA status for ALL issues in project <strong>{projectKey}</strong> and update their custom fields in Jira.
                                            <br /><br />
                                            This action cannot be undone, but you can run it again to update values.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkSync}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {isSyncing && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{syncStatus}</span>
                                    <span>{syncProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${syncProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {syncResults && (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-md flex items-start gap-3 ${syncResults.failed === 0 ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
                                    {syncResults.failed === 0 ? (
                                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} className="mt-0.5 text-green-600" />
                                    ) : (
                                        <HugeiconsIcon icon={AlertCircleIcon} size={20} className="mt-0.5 text-amber-600" />
                                    )}
                                    <div className="space-y-1">
                                        <p className="font-medium">Sync Completed</p>
                                        <p className="text-sm">
                                            Successfully synced {syncResults.successful} issues.
                                            {syncResults.failed > 0 && ` Failed to sync ${syncResults.failed} issues.`}
                                        </p>
                                    </div>
                                </div>

                                {syncResults.failed > 0 && (
                                    <div className="border rounded-md p-4 space-y-2">
                                        <p className="font-medium text-sm">Errors:</p>
                                        <ul className="text-sm text-destructive space-y-1 max-h-40 overflow-y-auto">
                                            {syncResults.errors.map((err, i) => (
                                                <li key={i}>{err.issueKey}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Button variant="outline" onClick={() => setSyncResults(null)}>
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Export/Import Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Export / Import Settings</CardTitle>
                    <CardDescription>
                        Share your SLA configuration with team members
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex-1">
                            📥 Export Settings
                        </Button>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="flex-1"
                        >
                            📤 Import Settings
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Export your current settings to a JSON file to share with team members.
                        They can import it to use the same SLA configuration.
                    </p>
                    
                    {/* Import Result Dialog */}
                    <AlertDialog open={importResult !== null} onOpenChange={(open) => !open && setImportResult(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {importResult?.success ? '✅ Import Successful' : '❌ Import Failed'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {importResult?.message}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction onClick={() => setImportResult(null)}>
                                    OK
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HugeiconsIcon icon={Notification01Icon} size={20} />
                        Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Configure how you receive SLA alerts and notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* In-App Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <HugeiconsIcon icon={Notification01Icon} size={16} className="text-muted-foreground" />
                                In-App Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Show notification badges and alerts in the app
                            </p>
                        </div>
                        <Switch
                            checked={notifSettings.inAppEnabled}
                            onCheckedChange={(checked) => updateNotifSetting('inAppEnabled', checked)}
                        />
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <HugeiconsIcon icon={Mail01Icon} size={16} className="text-muted-foreground" />
                                Email Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Send email alerts for at-risk and breached SLAs
                            </p>
                        </div>
                        <Switch
                            checked={notifSettings.emailEnabled}
                            onCheckedChange={(checked) => updateNotifSetting('emailEnabled', checked)}
                        />
                    </div>

                    {/* Sound Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <HugeiconsIcon icon={VolumeHighIcon} size={16} className="text-muted-foreground" />
                                Sound Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Play a sound when new notifications arrive
                            </p>
                        </div>
                        <Switch
                            checked={notifSettings.soundEnabled}
                            onCheckedChange={(checked) => updateNotifSetting('soundEnabled', checked)}
                        />
                    </div>

                    {/* Quiet Hours */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Moon02Icon} size={16} className="text-muted-foreground" />
                                    Quiet Hours
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Silence notifications during specific hours
                                </p>
                            </div>
                            <Switch
                                checked={notifSettings.quietHoursEnabled}
                                onCheckedChange={(checked) => updateNotifSetting('quietHoursEnabled', checked)}
                            />
                        </div>

                        {notifSettings.quietHoursEnabled && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <Label htmlFor="quiet-start">Start Time</Label>
                                    <Input
                                        id="quiet-start"
                                        type="time"
                                        value={notifSettings.quietHoursStart}
                                        onChange={(e) => updateNotifSetting('quietHoursStart', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quiet-end">End Time</Label>
                                    <Input
                                        id="quiet-end"
                                        type="time"
                                        value={notifSettings.quietHoursEnd}
                                        onChange={(e) => updateNotifSetting('quietHoursEnd', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Clear Notifications */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Clear All Notifications</Label>
                                <p className="text-xs text-muted-foreground">
                                    You have {notifications.length} notifications stored
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        disabled={notifications.length === 0}
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-1" />
                                        Clear All
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently remove all {notifications.length} notifications. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={clearNotifications}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Clear All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Hours & Holidays */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Business Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business Hours</CardTitle>
                        <CardDescription>Define working hours for SLA calculations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-hour">Start Hour (24h)</Label>
                                <Input
                                    id="start-hour"
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={businessHours.startHour}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBusinessHours({ startHour: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-hour">End Hour (24h)</Label>
                                <Input
                                    id="end-hour"
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={businessHours.endHour}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBusinessHours({ endHour: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Input value={businessHours.timezone} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Timezone is currently fixed to Asia/Manila</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Holidays */}
                <Card>
                    <CardHeader>
                        <CardTitle>Holidays</CardTitle>
                        <CardDescription>Manage public holidays (excluded from business days)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute left-2.5 top-2.5">
                                    <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-muted-foreground" />
                                </div>
                                <Input
                                    type="date"
                                    className="pl-9"
                                    value={newHoliday}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHoliday(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddHoliday} disabled={!newHoliday}>
                                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                            </Button>
                        </div>
                        <div className="border rounded-md h-[200px] overflow-y-auto p-2 space-y-1">
                            {holidays.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8 text-sm">No holidays configured</div>
                            ) : (
                                holidays.map((date) => (
                                    <div key={date} className="flex justify-between items-center p-2 hover:bg-muted rounded-md text-sm group">
                                        <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeHoliday(date)}
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} size={12} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
