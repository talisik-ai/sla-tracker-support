import { Link } from '@tanstack/react-router'
import { Settings, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-xl">Salina SLA Tracker</span>
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
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-5 w-5" />
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
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
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
          </nav>
        </div>
      )}
    </header>
  )
}
