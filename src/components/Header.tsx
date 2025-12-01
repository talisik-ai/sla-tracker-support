import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  DashboardBrowsingIcon,
  Settings01Icon,
  Menu01Icon,
  Cancel01Icon,
  Download01Icon
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { usePWAInstall } from '@/components/pwa'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isInstallable, install } = usePWAInstall()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <HugeiconsIcon
              icon={DashboardBrowsingIcon}
              size={24}
              color="#d0021b"
              strokeWidth={1.5}
            />
            <span className="font-bold text-xl">SLA Tracker</span>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/issues"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
            >
              Issues
            </Link>
            <Link
              to="/developers"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
            >
              Developers
            </Link>
            <Link
              to="/reports"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
            >
              Reports
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {isInstallable && (
            <Button
              variant="ghost"
              size="icon"
              title="Install App"
              onClick={install}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            >
              <HugeiconsIcon icon={Download01Icon} size={20} />
            </Button>
          )}
          <Link to="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <HugeiconsIcon icon={Settings01Icon} size={20} />
            </Button>
          </Link>
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Menu"
          >
            {mobileMenuOpen ? (
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container flex flex-col space-y-4 px-4 py-4">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-foreground/80 text-muted-foreground text-lg"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/issues"
              className="transition-colors hover:text-foreground/80 text-muted-foreground text-lg"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Issues
            </Link>
            <Link
              to="/developers"
              className="transition-colors hover:text-foreground/80 text-muted-foreground text-lg"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Developers
            </Link>
            <Link
              to="/reports"
              className="transition-colors hover:text-foreground/80 text-muted-foreground text-lg"
              activeProps={{
                className: 'text-foreground font-semibold'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Reports
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
