# Jira Webhook Setup - Important Limitation

## ⚠️ Important: Jira Cloud Webhook API Limitation

**Issue**: Jira Cloud's webhook REST API (`/rest/api/3/webhook`) requires OAuth 2.0 or Connect app authentication. Standard API tokens (basic auth) are **not supported**.

**Error**: 
```
{"errorMessages":["Only Connect and OAuth 2.0 apps can use this operation"],"errors":{}}
```

## Recommended Alternative: Jira Automation Rules

Instead of using the REST API, use **Jira's built-in Automation** to trigger webhooks:

### Step-by-Step Setup

1. **Go to Jira Automation**
   - Navigate to **Jira Settings → System → Automation** (or **Project Settings → Automation** for project-level)

2. **Create a New Rule**
   - Click **Create rule**

3. **Configure Trigger**
   - **Trigger**: Select **Issue created**, **Issue updated**, or **Issue deleted**
   - **Add scope**: (Optional) Filter by project or JQL

4. **Add Action: Send Web Request**
   - Click **Add action**
   - Select **Send web request**
   - **Webhook URL**: `https://herbaceously-postsaccular-marty.ngrok-free.dev/api/webhooks/jira`
   - **HTTP method**: POST
   - **Headers**: 
     ```
     Content-Type: application/json
     ```
   - **Webhook body**: Custom data (use Smart Values)
     ```json
     {
       "webhookEvent": "jira:issue_updated",
       "issue": {
         "key": "{{issue.key}}",
         "id": "{{issue.id}}",
         "fields": {
           "summary": "{{issue.summary}}",
           "status": {
             "name": "{{issue.status.name}}",
             "statusCategory": {
               "key": "{{issue.status.statusCategory.key}}"
             }
           },
           "priority": {
             "name": "{{issue.priority.name}}"
           },
           "assignee": {
             "displayName": "{{issue.assignee.displayName}}",
             "emailAddress": "{{issue.assignee.emailAddress}}"
           }
         }
       }
     }
     ```

5. **Name and Enable**
   - Give it a name (e.g., "SLA Tracker Webhook")
   - Turn it **ON**

6. **Repeat for Each Event**
   - Create separate rules for **Issue created** and **Issue deleted** if needed
   - Or use **Issue updated** which fires on all changes

### Benefits of This Approach

✅ No OAuth or Connect app needed  
✅ Works with standard Jira Cloud  
✅ Visual UI configuration  
✅ Built-in retry logic  
✅ Can filter by project/JQL  
✅ Free on Jira Cloud plans  

## Alternative: Auto-Refresh (Polling)

If Jira Automation isn't suitable, the SLA Tracker can use **automatic polling** instead:

- Dashboard auto-refreshes every 60 seconds (configurable)
- More reliable than webhooks
- No external dependencies
- Works offline/locally

See the implementation in `src/lib/polling/auto-refresh.ts` (if implemented).

## Advanced: OAuth 2.0 App (Complex)

For full webhook API access, you'd need to:

1. Create a Jira Cloud app with OAuth 2.0
2. Register it in Atlassian Developer Console
3. Implement OAuth flow in your application
4. Use OAuth tokens instead of API tokens

This is significantly more complex and typically only needed for marketplace apps.

## Troubleshooting Automation Rules

### Rule Not Triggering
- Check rule is **enabled**
- Verify the trigger conditions match your issues
- Check Automation audit log for errors

### Webhook Receiving Wrong Data
- Test the webhook body format with Smart Values
- Use `{{issue}}` to see all available fields
- Check ngrok request inspector at http://127.0.0.1:4040

### ngrok URL Changed
- Update the Automation rule with new ngrok URL
- For persistent URLs, use a deployed server or ngrok paid plan

## Summary

**Recommended Approach**: Use **Jira Automation Rules** to trigger webhooks  
**Fallback**: Use **Auto-refresh/Polling** (no external setup needed)  
**Advanced**: Create an OAuth 2.0 app (only if building a marketplace product)
