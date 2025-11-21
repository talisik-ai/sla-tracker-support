# Salina Jira SLA Tracker - Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables** (Optional for mock data)
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Jira credentials if you want live data
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Configuration

The application works with mock data out-of-the-box. To connect to a real Jira instance:

1. Get a Jira API token from: https://id.atlassian.com/manage-profile/security/api-tokens
2. Copy `.env.example` to `.env.local`
3. Fill in the following variables:
   - `VITE_JIRA_INSTANCE_URL`: Your Jira URL (e.g., https://yourcompany.atlassian.net)
   - `VITE_JIRA_EMAIL`: Your Jira email
   - `VITE_JIRA_API_TOKEN`: Your API token
   - `VITE_JIRA_PROJECT_KEY`: Your project key (default: SAL)

## Features

### Dashboard (`/dashboard`)
- Real-time SLA metrics
- Critical issues list with countdown timers
- At-risk issues tracking
- Auto-refresh every 30 seconds

### Developer Performance (`/developers`)
- Per-developer workload breakdown
- Priority distribution
- SLA compliance tracking
- At-risk and breached counts

## Project Structure

```
src/
├── routes/              # Page routes
│   ├── dashboard.tsx    # Main dashboard
│   └── developers.tsx   # Developer performance
├── components/          # React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── issues/          # Issue-related components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utilities and logic
│   ├── jira/            # Jira API client and types
│   └── sla/             # SLA calculation logic
└── styles.css           # Global styles
```

## Tech Stack

- **Framework**: TanStack Start (React + Router)
- **UI**: shadcn/ui + Tailwind CSS
- **API**: Jira REST API v3
- **State**: React hooks
- **TypeScript**: Strict mode

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm test` - Run tests

## Troubleshooting

### "Buffer is not defined" Error
This has been fixed in the latest version. The application now uses browser-compatible `btoa()` for base64 encoding instead of Node.js `Buffer`. Make sure your dev server has restarted to pick up the changes.

### Mock Data vs Live Data
- By default, the application uses mock data
- To switch to live Jira data, configure `.env.local` with your credentials
- The application will automatically try live data first and fall back to mock data if credentials are missing or invalid
