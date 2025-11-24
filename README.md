# Jira SLA Tracker - Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables** (Optional - app works with mock data)
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Jira credentials
   ```

3. **Configure Your Project** (Optional)
   - The app defaults to mock data
   - To connect to Jira: Add credentials to `.env.local`
   - See "Environment Configuration" section below

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **Run Tests**
   ```bash
   npm test
   ```

## Environment Configuration

### Working with Mock Data (Default)
The application works perfectly out-of-the-box with mock data - **no configuration needed**!

### Connecting to Real Jira (Optional)

1. **Get a Jira API token**
   - Visit: https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the generated token

2. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in your Jira credentials in `.env.local`**
   ```bash
   VITE_JIRA_INSTANCE_URL=https://yourcompany.atlassian.net
   VITE_JIRA_EMAIL=your-email@example.com
   VITE_JIRA_API_TOKEN=your-api-token-here
   VITE_JIRA_PROJECT_KEY=YOUR-PROJECT-KEY
   ```

4. **Restart the dev server**
   ```bash
   npm run dev
   ```

### Switching Projects
You can change the project key anytime in **Settings** → **Jira Project** section.

### Security Notes
- ⚠️ **Never commit `.env.local` to git** (it's already in `.gitignore`)
- 🔒 Keep your API tokens secure
- 🔄 Rotate tokens regularly for security

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

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm test` - Run test suite (Vitest)

## Testing

The project includes comprehensive test coverage for critical business logic:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- ✅ SLA calculation logic (12+ tests)
- ✅ Critical priority handling
- ✅ Resolution tracking
- ✅ First response detection
- ✅ Edge cases and fallbacks

## Troubleshooting

### "Buffer is not defined" Error
This has been fixed in the latest version. The application now uses browser-compatible `btoa()` for base64 encoding instead of Node.js `Buffer`. Make sure your dev server has restarted to pick up the changes.

### Mock Data vs Live Data
- By default, the application uses mock data
- To switch to live Jira data, configure `.env.local` with your credentials
- The application will automatically try live data first and fall back to mock data if credentials are missing or invalid
