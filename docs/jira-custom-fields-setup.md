# Jira Custom Field Setup Guide

## Overview

To sync SLA data from the SLA Tracker to Jira, you need to create 3 custom fields in your Jira project. This guide will walk you through the process.

## Prerequisites

- Jira admin access (or Project admin access)
- Access to your Jira instance

## Step 1: Create Custom Fields

### 1.1 Navigate to Custom Fields

1. Go to **Jira Settings** (⚙️ icon in top right)
2. Click **Issues** in the left sidebar
3. Click **Custom fields**
4. Click **Create custom field** button

### 1.2 Create "SLA Due Date" Field

1. Select field type: **Date Time Picker**
2. Click **Next**
3. Enter details:
   - **Name**: `SLA Due Date`
   - **Description**: `Calculated SLA deadline for this issue (managed by SLA Tracker)`
4. Click **Create**
5. Associate with screens (select your project's screens)
6. Click **Update**

**Note the field ID** - it will look like `customfield_10050`

### 1.3 Create "SLA Status" Field

1. Click **Create custom field** again
2. Select field type: **Select List (single choice)**
3. Click **Next**
4. Enter details:
   - **Name**: `SLA Status`
   - **Description**: `Current SLA status (managed by SLA Tracker)`
5. Click **Create**
6. Add options:
   - `On Track`
   - `At Risk`
   - `Breached`
   - `Met`
7. Associate with screens
8. Click **Update**

**Note the field ID** - it will look like `customfield_10051`

### 1.4 Create "SLA Time Used %" Field

1. Click **Create custom field** again
2. Select field type: **Number Field**
3. Click **Next**
4. Enter details:
   - **Name**: `SLA Time Used %`
   - **Description**: `Percentage of SLA time used (managed by SLA Tracker)`
5. Click **Create**
6. Associate with screens
7. Click **Update**

**Note the field ID** - it will look like `customfield_10052`

## Step 2: Find Custom Field IDs

### Method 1: Via Issue View

1. Open any issue in your project
2. Right-click → **Inspect Element**
3. Search for your custom field name
4. Look for `customfield_XXXXX` in the HTML
5. Copy the field ID

### Method 2: Via REST API

1. Open browser console
2. Run:
```javascript
fetch('/rest/api/3/field')
  .then(r => r.json())
  .then(fields => {
    const slaFields = fields.filter(f => 
      f.name.includes('SLA') && f.custom
    )
    console.table(slaFields.map(f => ({
      name: f.name,
      id: f.id
    })))
  })
```

3. Copy the field IDs from the console output

## Step 3: Configure in SLA Tracker

1. Open your `.env.local` file
2. Add the field IDs:

```env
# Jira Custom Field IDs for SLA Sync
VITE_JIRA_CUSTOM_FIELD_SLA_DUE_DATE=customfield_10050
VITE_JIRA_CUSTOM_FIELD_SLA_STATUS=customfield_10051
VITE_JIRA_CUSTOM_FIELD_SLA_TIME_USED=customfield_10052
```

3. Replace the field IDs with your actual ones
4. Restart your dev server

## Step 4: Test the Integration

1. Open the SLA Tracker
2. Navigate to any issue
3. Click **Sync to Jira** button
4. Open the issue in Jira
5. Verify the custom fields are populated with SLA data

## Troubleshooting

### Fields Not Showing in Jira
- Check that fields are associated with the correct screens
- Ensure your project is using those screens
- Try editing the issue to see if fields appear

### Field IDs Not Working
- Verify you copied the correct field IDs
- Ensure format is `customfield_XXXXX` (no spaces)
- Restart dev server after changing .env.local

### Permission Errors
- Ensure your API token has edit permissions
- Check Jira project permissions for field editing
- Verify admin access for custom field creation

## Next Steps

Once fields are created and configured:
1. Use "Sync to Jira" button on individual issues
2. Use "Sync All Issues" in Settings for bulk updates
3. Create Jira dashboards using SLA custom fields
4. Build JQL queries: `"SLA Status" = "At Risk"`

## Benefits

After setup, you can:
- ✅ See SLA status in Jira for all users
- ✅ Filter issues by SLA status in Jira
- ✅ Create Jira dashboards with SLA metrics
- ✅ Set up Jira automations based on SLA
- ✅ Use SLA fields in JQL queries
