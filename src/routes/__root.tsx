import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { PWAInstallPrompt, PWAUpdatePrompt, NotificationHandler } from '../components/pwa'

import appCss from '../styles.css?url'
import scrollbarCss from '../styles/scrollbar.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: 'SLA Tracker',
      },
      {
        name: 'description',
        content: 'Track and manage Jira issues with SLA compliance monitoring',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'SLA Tracker',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: scrollbarCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/sla_dashboard_icon.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/sla_dashboard_icon.png',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Page Not Found</p>
      <a href="/" className="text-primary hover:underline">
        Go back home
      </a>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ErrorBoundary>
          <Header />
          {children}
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
          <NotificationHandler />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
