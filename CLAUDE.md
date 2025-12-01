# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jira SLA Tracker - A real-time dashboard for tracking Jira issue SLA compliance. Built with TanStack Start (React + Router), uses server-side API proxying to Jira, and Zustand for state management.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Testing
npm test             # Run tests (vitest run)
npm run test:watch   # Watch mode
npm run test:coverage # With coverage

# Build
npm run build        # Production build
npm run serve        # Preview production build

# Quality
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier
```

## Architecture

### Stack
- **Framework**: TanStack Start with Nitro server (SSR + API routes)
- **Router**: TanStack Router (file-based routing in `src/routes/`)
- **State**: Zustand with persist middleware (`src/lib/sla/store.ts`, `src/lib/notifications/store.ts`)
- **UI**: shadcn/ui components (`src/components/ui/`) + Tailwind CSS v4
- **Icons**: Hugeicons (`@hugeicons/react`)
- **Testing**: Vitest + Testing Library + jsdom

### Key Directories
- `src/routes/` - File-based routes (pages and API endpoints)
- `src/lib/jira/` - Jira API client and types
- `src/lib/sla/` - SLA calculation logic and rules
- `src/components/` - React components (dashboard, issues, ui)

### API Routes Pattern
API routes use TanStack Start's file-based routing with server handlers:
```typescript
// src/routes/api.jira.search.ts
export const Route = createFileRoute('/api/jira/search')({
  server: {
    handlers: {
      GET: async ({ request }) => { ... }
    }
  }
})
```

### Data Flow
1. Client calls `/api/jira/*` endpoints (via `src/lib/jira/api.ts`)
2. Server routes proxy to Jira REST API v3 with auth
3. SLA calculations happen client-side (`src/lib/sla/calculator.ts`)
4. Settings persist in localStorage via Zustand store

### SLA Calculation
The core SLA logic is in `src/lib/sla/`:
- `calculator.ts` - Main `calculateSLA(issue, settings)` function
- `rules.ts` - Default SLA rules, priority mapping, business hours
- `store.ts` - Persisted settings (rules, holidays, project key)

Priority mapping: Jira's `Highest`/`Critical` → `Critical`, `Lowest` → `Low`

### Environment Variables
Development uses `VITE_` prefixed vars in `.env.local`:
- `VITE_JIRA_INSTANCE_URL` - Jira Cloud URL
- `VITE_JIRA_EMAIL` / `VITE_JIRA_API_TOKEN` - Auth credentials
- `VITE_JIRA_PROJECT_KEY` - Default project key

Production (Vercel) uses same vars - bundled at build time via Nitro.

## Testing Patterns

Tests use Vitest with jsdom. Test files co-located with source: `*.test.ts`.

```typescript
// Example: src/lib/sla/calculator.test.ts
import { describe, it, expect } from 'vitest'

function createMockIssue(overrides = {}) { ... }

describe('SLA Calculator', () => {
  it('should mark Critical issue as breached after 2 hours', () => {
    const issue = createMockIssue({ ... })
    const sla = calculateSLA(issue)
    expect(sla.firstResponseStatus).toBe('breached')
  })
})
```

Coverage thresholds: 70% for lines, functions, branches, statements.

## Path Aliases

Use `@/*` for imports from `src/`:
```typescript
import { calculateSLA } from '@/lib/sla/calculator'
import { Button } from '@/components/ui/button'
```

## Pre-commit Hooks

Husky + lint-staged runs on commit:
- `eslint --fix` on `.ts/.tsx` files
- `vitest related --run` for affected tests
- `prettier --write` for formatting
