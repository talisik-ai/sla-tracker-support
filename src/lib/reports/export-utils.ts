import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { JiraIssue, SLAData } from '@/lib/jira/types'
import { DeveloperPerformance } from '@/lib/sla/developer-performance'
import { format } from 'date-fns'

// Types for report data
export interface SLASummaryData {
    totalIssues: number
    metSLA: number
    breachedSLA: number
    atRiskSLA: number
    ongoingSLA: number
    complianceRate: number
}

export interface DeveloperReportData {
    name: string
    totalIssues: number
    metSLA: number
    breached: number
    atRisk: number
    complianceRate: number
    avgResponseTime: number
    avgResolutionTime: number
}

export interface IssueReportData {
    key: string
    summary: string
    priority: string
    status: string
    assignee: string
    created: string
    slaStatus: string
    timeElapsed: string
    timeRemaining: string
}

// ==================== EXCEL EXPORTS ====================

export function exportSLASummaryToExcel(data: SLASummaryData, filename: string = 'sla-summary-report') {
    const ws_data = [
        ['SLA Summary Report'],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Metric', 'Count', 'Percentage'],
        ['Total Issues', data.totalIssues, '100%'],
        ['Met SLA', data.metSLA, `${((data.metSLA / data.totalIssues) * 100).toFixed(1)}%`],
        ['Breached SLA', data.breachedSLA, `${((data.breachedSLA / data.totalIssues) * 100).toFixed(1)}%`],
        ['At Risk', data.atRiskSLA, `${((data.atRiskSLA / data.totalIssues) * 100).toFixed(1)}%`],
        ['Ongoing', data.ongoingSLA, `${((data.ongoingSLA / data.totalIssues) * 100).toFixed(1)}%`],
        [],
        ['Overall Compliance Rate', `${data.complianceRate}%`],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Set column widths
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }]
    
    XLSX.utils.book_append_sheet(wb, ws, 'SLA Summary')
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportDeveloperPerformanceToExcel(developers: DeveloperReportData[], filename: string = 'developer-performance-report') {
    const ws_data = [
        ['Developer Performance Report'],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Developer', 'Total Issues', 'Met SLA', 'Breached', 'At Risk', 'Compliance %', 'Avg Response (min)', 'Avg Resolution (hrs)'],
        ...developers.map(dev => [
            dev.name,
            dev.totalIssues,
            dev.metSLA,
            dev.breached,
            dev.atRisk,
            `${dev.complianceRate.toFixed(1)}%`,
            dev.avgResponseTime.toFixed(0),
            dev.avgResolutionTime.toFixed(1)
        ])
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, 
        { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 20 }
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Developer Performance')
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportIssueStatusToExcel(issues: IssueReportData[], filename: string = 'issue-status-report') {
    const ws_data = [
        ['Issue Status Report'],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Issue Key', 'Summary', 'Priority', 'Status', 'Assignee', 'Created', 'SLA Status', 'Time Elapsed', 'Time Remaining'],
        ...issues.map(issue => [
            issue.key,
            issue.summary,
            issue.priority,
            issue.status,
            issue.assignee,
            issue.created,
            issue.slaStatus,
            issue.timeElapsed,
            issue.timeRemaining
        ])
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, 
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Issue Status')
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ==================== PDF EXPORTS ====================

export function exportSLASummaryToPDF(data: SLASummaryData, filename: string = 'sla-summary-report') {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.text('SLA Summary Report', 14, 22)
    
    // Metadata
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    
    // Table
    autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Count', 'Percentage']],
        body: [
            ['Total Issues', data.totalIssues.toString(), '100%'],
            ['Met SLA', data.metSLA.toString(), `${((data.metSLA / data.totalIssues) * 100).toFixed(1)}%`],
            ['Breached SLA', data.breachedSLA.toString(), `${((data.breachedSLA / data.totalIssues) * 100).toFixed(1)}%`],
            ['At Risk', data.atRiskSLA.toString(), `${((data.atRiskSLA / data.totalIssues) * 100).toFixed(1)}%`],
            ['Ongoing', data.ongoingSLA.toString(), `${((data.ongoingSLA / data.totalIssues) * 100).toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Compliance Rate
    const finalY = (doc as any).lastAutoTable.finalY || 40
    doc.setFontSize(12)
    doc.text(`Overall Compliance Rate: ${data.complianceRate}%`, 14, finalY + 15)
    
    doc.save(`${filename}.pdf`)
}

export function exportDeveloperPerformanceToPDF(developers: DeveloperReportData[], filename: string = 'developer-performance-report') {
    const doc = new jsPDF('landscape')
    
    // Title
    doc.setFontSize(18)
    doc.text('Developer Performance Report', 14, 22)
    
    // Metadata
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    
    // Table
    autoTable(doc, {
        startY: 40,
        head: [['Developer', 'Total', 'Met', 'Breached', 'At Risk', 'Compliance %', 'Avg Response (min)', 'Avg Resolution (hrs)']],
        body: developers.map(dev => [
            dev.name,
            dev.totalIssues.toString(),
            dev.metSLA.toString(),
            dev.breached.toString(),
            dev.atRisk.toString(),
            `${dev.complianceRate.toFixed(1)}%`,
            dev.avgResponseTime.toFixed(0),
            dev.avgResolutionTime.toFixed(1)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
    })
    
    doc.save(`${filename}.pdf`)
}

export function exportIssueStatusToPDF(issues: IssueReportData[], filename: string = 'issue-status-report') {
    const doc = new jsPDF('landscape')
    
    // Title
    doc.setFontSize(18)
    doc.text('Issue Status Report', 14, 22)
    
    // Metadata
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    
    // Table
    autoTable(doc, {
        startY: 40,
        head: [['Key', 'Summary', 'Priority', 'Status', 'Assignee', 'SLA Status', 'Time Remaining']],
        body: issues.map(issue => [
            issue.key,
            issue.summary.substring(0, 40) + (issue.summary.length > 40 ? '...' : ''),
            issue.priority,
            issue.status,
            issue.assignee.substring(0, 15),
            issue.slaStatus,
            issue.timeRemaining
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
    })
    
    doc.save(`${filename}.pdf`)
}

// ==================== MARKDOWN EXPORTS ====================

export function exportSLASummaryToMarkdown(data: SLASummaryData, filename: string = 'sla-summary-report'): void {
    const markdown = `# SLA Summary Report

**Generated:** ${new Date().toLocaleString()}

## Overview

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Issues | ${data.totalIssues} | 100% |
| Met SLA | ${data.metSLA} | ${((data.metSLA / data.totalIssues) * 100).toFixed(1)}% |
| Breached SLA | ${data.breachedSLA} | ${((data.breachedSLA / data.totalIssues) * 100).toFixed(1)}% |
| At Risk | ${data.atRiskSLA} | ${((data.atRiskSLA / data.totalIssues) * 100).toFixed(1)}% |
| Ongoing | ${data.ongoingSLA} | ${((data.ongoingSLA / data.totalIssues) * 100).toFixed(1)}% |

## Overall Compliance Rate

**${data.complianceRate}%**

---
*Report generated by Jira SLA Tracker*
`
    
    downloadTextFile(markdown, `${filename}.md`)
}

export function exportDeveloperPerformanceToMarkdown(developers: DeveloperReportData[], filename: string = 'developer-performance-report'): void {
    const markdown = `# Developer Performance Report

**Generated:** ${new Date().toLocaleString()}

## Team Performance

| Developer | Total Issues | Met SLA | Breached | At Risk | Compliance % | Avg Response (min) | Avg Resolution (hrs) |
|-----------|--------------|---------|----------|---------|--------------|-------------------|---------------------|
${developers.map(dev => 
    `| ${dev.name} | ${dev.totalIssues} | ${dev.metSLA} | ${dev.breached} | ${dev.atRisk} | ${dev.complianceRate.toFixed(1)}% | ${dev.avgResponseTime.toFixed(0)} | ${dev.avgResolutionTime.toFixed(1)} |`
).join('\n')}

---
*Report generated by Jira SLA Tracker*
`
    
    downloadTextFile(markdown, `${filename}.md`)
}

export function exportIssueStatusToMarkdown(issues: IssueReportData[], filename: string = 'issue-status-report'): void {
    const markdown = `# Issue Status Report

**Generated:** ${new Date().toLocaleString()}

## All Issues

| Key | Summary | Priority | Status | Assignee | SLA Status | Time Remaining |
|-----|---------|----------|--------|----------|------------|----------------|
${issues.map(issue => 
    `| ${issue.key} | ${issue.summary.substring(0, 40)}${issue.summary.length > 40 ? '...' : ''} | ${issue.priority} | ${issue.status} | ${issue.assignee} | ${issue.slaStatus} | ${issue.timeRemaining} |`
).join('\n')}

---
*Report generated by Jira SLA Tracker*
`
    
    downloadTextFile(markdown, `${filename}.md`)
}

// Helper function to download text files
function downloadTextFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

