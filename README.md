# Jira SLA Tracker - Setup Instructions

> **Quality Gates Active**: This project uses automated pre-commit hooks to ensure code quality.

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

## 📡 Real-time Updates (Webhooks)

To enable real-time updates without manual refreshing, you need to configure Jira Webhooks.

### Local Development (Using ngrok)

Since Jira Cloud cannot reach `localhost`, you need a tunnel:

1.  **Install ngrok**: [https://ngrok.com/download](https://ngrok.com/download)
2.  **Start tunnel**:
    ```bash
    ngrok http 3000
    ```
3.  Copy the forwarding URL (e.g., `https://your-id.ngrok-free.app`)

### Configuring Jira

1.  Go to **Jira Settings** → **System** → **Webhooks**
2.  Click **Create a Webhook**
3.  **Name**: `SLA Tracker Local`
4.  **URL**: `https://your-id.ngrok-free.app/api/webhooks/jira`
5.  **Events**: Check the following under "Issue":
    - [x] created
    - [x] updated
    - [x] deleted
6.  **JQL Filter** (Optional): `project = "YOUR_PROJECT_KEY"`
7.  Click **Create**

Now, any change in Jira will instantly update your local dashboard!

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

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for TanStack Start applications.

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables in Vercel Dashboard**
   - `VITE_JIRA_INSTANCE_URL`
   - `VITE_JIRA_EMAIL`
   - `VITE_JIRA_API_TOKEN`
   - `VITE_JIRA_PROJECT_KEY`
   - `RESEND_API_KEY` (for email notifications)

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker (Self-Hosted)

Build and run with Docker:

```bash
# Build the image
docker build -t jira-sla-tracker \
  --build-arg VITE_JIRA_INSTANCE_URL=https://yourcompany.atlassian.net \
  --build-arg VITE_JIRA_PROJECT_KEY=YOUR_KEY \
  .

# Run the container
docker run -d -p 3000:3000 \
  -e VITE_JIRA_EMAIL=your-email@example.com \
  -e VITE_JIRA_API_TOKEN=your-token \
  -e RESEND_API_KEY=your-resend-key \
  jira-sla-tracker
```

### Option 3: GitHub Actions (CI/CD)

The repository includes GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`): Runs on every push/PR
  - Runs tests
  - Generates coverage report
  - Builds the project

- **Deploy** (`.github/workflows/deploy.yml`): Runs on push to `main`
  - Builds and tests
  - Deploys to Vercel
  - Builds Docker image to GHCR
  - Creates GitHub release

#### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VITE_JIRA_INSTANCE_URL` | Jira instance URL |
| `VITE_JIRA_PROJECT_KEY` | Default project key |
| `RESEND_API_KEY` | Resend API key for emails |

### Health Check

The application exposes a health endpoint:

```bash
curl http://localhost:3000/api/health
# Returns: { "status": "healthy", "timestamp": "...", "version": "1.0.0" }
```
