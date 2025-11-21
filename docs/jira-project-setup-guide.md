# Jira Project Setup Guide for SLA Tracker

## Overview

This guide will help you create a dedicated Jira project optimized for tracking customer support issues, bug reports, and internal requests with SLA compliance.

## Recommended Project Structure

**Project Type:** Jira Software (Kanban)  
**Project Key:** `SUPPORT` (or `BUGS`, `HELP`, `CUST`)  
**Project Name:** Customer Support / Bug Tracking  

---

## Step 1: Create the Project

### Via Jira Web Interface

1. **Navigate to Projects**
   - Click **Projects** in the top navigation
   - Click **Create project**

2. **Choose Template**
   - Select **Kanban** (recommended for support/bug tracking)
   - Or **Scrum** if you work in sprints
   - Click **Use template**

3. **Configure Project**
   - **Project type:** Team-managed or Company-managed (your choice)
   - **Project name:** `Customer Support` or `Bug Tracking`
   - **Project key:** `SUPPORT` (short, uppercase, unique)
   - Click **Create**

### Team-managed vs Company-managed

| Feature | Team-managed | Company-managed |
|---------|-------------|-----------------|
| Setup Speed | ⚡ Fast (5 min) | 🐢 Slower (15 min) |
| Customization | Limited | Full control |
| Workflows | Simplified | Advanced |
| Best For | Small teams, quick start | Enterprise, complex workflows |

**Recommendation:** Start with **Team-managed** for simplicity.

---

## Step 2: Configure Issue Types

### Recommended Issue Types

1. **Bug** 🐛
   - For software defects
   - Fields: Steps to reproduce, Expected vs Actual behavior

2. **Customer Request** 🎫
   - For customer support tickets
   - Fields: Customer name, Request type, Urgency

3. **Internal Issue** 🔧
   - For internal team issues
   - Fields: Department, Category

4. **Question** ❓
   - For information requests
   - Fields: Topic, Related product

### How to Configure

1. Go to **Project Settings** → **Issue types**
2. Click **Add issue type**
3. Create or select from Jira's defaults
4. Remove unused types (e.g., Epic, Story if not needed)

---

## Step 3: Set Up Priorities

### Recommended Priority Levels

| Priority | Response SLA | Resolution SLA | Use Case |
|----------|--------------|----------------|----------|
| **Critical** | 2 hours | 24 hours | System down, data loss |
| **High** | 4 hours | 48 hours | Major feature broken |
| **Medium** | 8 hours | 72 hours | Minor bugs, feature requests |
| **Low** | 24 hours | 7 days | Enhancements, questions |

### How to Configure

1. Go to **Project Settings** → **Priorities**
2. Ensure these priorities exist (Jira defaults usually include them)
3. Edit descriptions to match your SLA expectations

---

## Step 4: Configure Workflow

### Simple Support Workflow (Recommended)

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌────────┐
│  Open   │────▶│ In Progress │────▶│ Resolved │────▶│ Closed │
└─────────┘     └─────────────┘     └──────────┘     └────────┘
     │                  │                  │
     └──────────────────┴──────────────────┘
              (Any status can go back to Open)
```

**Status Meanings:**
- **Open:** New, unassigned issues
- **In Progress:** Actively being worked on
- **Resolved:** Fix implemented, awaiting verification
- **Closed:** Verified and complete

### How to Configure

1. Go to **Project Settings** → **Workflows**
2. Edit the default workflow or create a new one
3. Add statuses: Open, In Progress, Resolved, Closed
4. Configure transitions between statuses

---

## Step 5: Set Up Permissions

### Recommended Permission Scheme

| Role | Permissions |
|------|-------------|
| **Developers** | Create, Edit, Comment, Assign, Resolve |
| **Support Team** | Create, Comment, View |
| **Project Admins** | All permissions |
| **Customers** | No direct access (use portal if needed) |

### How to Configure

1. Go to **Project Settings** → **People**
2. Add team members to appropriate roles
3. For company-managed projects: Configure permission schemes

---

## Step 6: Create Custom Fields (for SLA Sync)

Follow the [Jira Custom Fields Setup Guide](./jira-custom-fields-setup.md) to create:

1. **SLA Due Date** (Date Time field)
2. **SLA Status** (Select list)
3. **SLA Time Used %** (Number field)

---

## Step 7: Configure in SLA Tracker

1. **Update `.env.local`:**
   ```env
   VITE_JIRA_PROJECT_KEY=SUPPORT
   ```

2. **Or configure multiple projects in Settings page** (after implementation):
   - Navigate to Settings
   - Add project keys: `SUPPORT, BUGS, HELP`
   - Save configuration

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## Step 8: Test the Integration

1. **Create a test issue in your new project:**
   - Title: "Test SLA Tracking"
   - Priority: High
   - Assign to yourself

2. **Open SLA Tracker dashboard:**
   - Navigate to `http://localhost:3000/dashboard`
   - Verify the test issue appears

3. **Test SLA sync:**
   - Click on test issue
   - Click "Sync to Jira"
   - Verify custom fields populate in Jira

---

## Best Practices

### 1. Naming Conventions

Use clear, consistent naming:
```
[SUPPORT-123] Customer unable to login
[SUPPORT-124] Bug: Dashboard shows wrong data
[SUPPORT-125] Feature Request: Export to CSV
```

### 2. Priority Guidelines

Document when to use each priority:
- **Critical:** Document in project description
- **High:** Provide examples
- **Medium:** Set defaults
- **Low:** Communicate turnaround time

### 3. SLA Rules

Match SLA rules to business hours:
- Set realistic targets
- Account for weekends/holidays
- Review and adjust quarterly

### 4. Automation

Set up Jira automations:
- Auto-assign based on component
- Notify on SLA breach
- Auto-close after 30 days in Resolved

---

## Troubleshooting

### Project doesn't appear in tracker

1. Check `VITE_JIRA_PROJECT_KEY` matches project key
2. Verify API token has project access
3. Check project permissions
4. Restart dev server

### Custom fields not syncing

1. Verify custom field IDs in `.env.local`
2. Check API token has edit permissions
3. Ensure fields are on issue screen
4. Review server logs for errors

### Issues not loading

1. Check Jira instance URL
2. Verify API credentials
3. Test JQL query in Jira directly
4. Check network/firewall settings

---

## Next Steps

1. ✅ Create project in Jira
2. ✅ Configure issue types and workflows
3. ✅ Set up custom fields
4. ✅ Update SLA Tracker configuration
5. ✅ Test with sample issues
6. ✅ Train team on new process
7. ✅ Monitor SLA compliance

---

## Additional Resources

- [Jira Documentation](https://support.atlassian.com/jira-software-cloud/)
- [Custom Fields Setup Guide](./jira-custom-fields-setup.md)
- [SLA Tracker Settings Configuration](../README.md)
