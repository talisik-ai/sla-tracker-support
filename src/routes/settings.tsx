import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSLAStore } from '@/lib/sla/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Plus, Trash2, Calendar } from 'lucide-react'

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

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            file.text().then((text) => {
                const success = importSettings(text)
                if (success) {
                    alert('Settings imported successfully!')
                } else {
                    alert('Failed to import settings. Please check the file format.')
                }
            })
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Configure SLA rules, business hours, and holidays</p>
                </div>
                <Button variant="outline" onClick={resetSettings} className="text-destructive hover:text-destructive">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                </Button>
            </div>

            {/* SLA Rules Configuration */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">SLA Rules by Priority</h2>
                <div className="grid gap-6 md:grid-cols-2">
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

        </Card>

            {/* Export/Import Settings */ }
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
        </CardContent>
    </Card>

    {/* Business Hours & Holidays */ }
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
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9"
                            value={newHoliday}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHoliday(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddHoliday} disabled={!newHoliday}>
                        <Plus className="h-4 w-4" />
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
                                    <Trash2 className="h-3 w-3" />
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
