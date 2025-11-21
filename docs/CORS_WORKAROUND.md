# CORS Solution for Jira API

## Problem
Jira's API doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. Attempting to call Jira directly from the browser results in:
```
Access to XMLHttpRequest at 'https://media-meter.atlassian.net/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Implemented Solution: Server-Side Proxy

This application now uses a **server-side proxy** to resolve CORS issues:

### How It Works
1. **Client-side code** (`/src/lib/jira/api.ts`) makes requests to `/api/jira/search` (local endpoint)
2. **Server-side route** (`/src/routes/api.jira.search.ts`) receives the request
3. **Server makes authenticated request** to Jira API using credentials from environment variables
4. **Server returns data** to the client without CORS issues

### Benefits
✅ **No CORS errors** - Server-to-server calls don't have CORS restrictions  
✅ **Secure credentials** - API tokens stay server-side, never exposed to the browser  
✅ **Production-ready** - Works in all environments without browser extensions  
✅ **Automatic fallback** - Falls back to mock data if server credentials are missing

### Environment Variables Required
The server proxy requires these environment variables in `.env.local`:
```bash
VITE_JIRA_EMAIL=your-email@example.com
VITE_JIRA_API_TOKEN=your-api-token
VITE_JIRA_INSTANCE_URL=https://your-domain.atlassian.net
VITE_JIRA_PROJECT_KEY=SAL
```

### Testing the Implementation
1. **Start the dev server**: `npm run dev`
2. **Open browser console** at http://localhost:3000/dashboard
3. **Look for**: `[Dashboard] Fetching from Jira API via server proxy...`
4. **Verify**: `[Dashboard] Successfully fetched X issues from Jira`
5. **Confirm**: No CORS errors in the console
6. **Network tab**: Requests go to `http://localhost:3000/api/jira/search` (not media-meter.atlassian.net)

## Alternative Solutions (Not Implemented)

### Browser Extension (Development Only)
For quick local testing without setting up credentials:
- Chrome/Edge: "Allow CORS: Access-Control-Allow-Origin"
- Firefox: "CORS Everywhere"

⚠️ **Not recommended**: Only bypasses CORS locally, doesn't work in production

### OAuth Implementation
Could implement Jira OAuth instead of API tokens for potentially better CORS support, but adds complexity.

## Troubleshooting

**Issue**: Still seeing CORS errors
- **Check**: Are environment variables set correctly in `.env.local`?
- **Verify**: Did you restart the dev server after adding/changing `.env.local`?
- **Debug**: Check server logs for error messages from the proxy

**Issue**: Getting "Jira credentials not configured" error
- **Fix**: Ensure all four environment variables are set in `.env.local`
- **Restart**: Stop and restart `npm run dev`

**Issue**: App shows mock data instead of real data
- **Expected**: This is the fallback behavior when the proxy fails
- **Check console**: Look for detailed error messages explaining why the proxy failed

